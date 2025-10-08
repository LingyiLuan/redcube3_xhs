"""
Machine Learning Models for Interview Predictions
Implements classification models and skill gap analysis
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class InterviewSuccessPredictor:
    """
    ML model to predict interview success probability

    Uses Random Forest classifier trained on historical interview data
    """

    def __init__(self):
        self.model: Optional[RandomForestClassifier] = None
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.is_trained = False
        self.training_samples = 0
        self.accuracy: Optional[float] = None
        self.last_trained: Optional[str] = None
        self.feature_names: List[str] = []

        # Common tech companies and roles for feature engineering
        self.tech_companies = [
            'google', 'meta', 'amazon', 'microsoft', 'apple',
            'netflix', 'tesla', 'uber', 'airbnb', 'stripe',
            'facebook', 'faang'
        ]

        self.tech_roles = [
            'software engineer', 'data scientist', 'product manager',
            'data engineer', 'ml engineer', 'devops', 'sre',
            'frontend', 'backend', 'fullstack', 'full stack'
        ]

    def train(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Train the prediction model on scraped interview data

        Args:
            df: DataFrame with columns: body_text, potential_outcome, metadata

        Returns:
            Training statistics
        """
        try:
            logger.info(f"Training with {len(df)} samples...")

            # Prepare features
            X = self._extract_features(df)
            y = (df['potential_outcome'] == 'positive').astype(int)

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )

            # Train Random Forest model
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=10,
                random_state=42,
                class_weight='balanced'
            )

            self.model.fit(X_train, y_train)

            # Evaluate
            y_pred = self.model.predict(X_test)
            self.accuracy = accuracy_score(y_test, y_pred)

            logger.info(f"✅ Model trained with accuracy: {self.accuracy:.3f}")
            logger.info("\n" + classification_report(y_test, y_pred, target_names=['Negative', 'Positive']))

            self.is_trained = True
            self.training_samples = len(df)
            self.last_trained = datetime.utcnow().isoformat()

            return {
                'success': True,
                'training_samples': self.training_samples,
                'accuracy': self.accuracy,
                'positive_samples': int(y.sum()),
                'negative_samples': int((~y.astype(bool)).sum())
            }

        except Exception as e:
            logger.error(f"Training error: {str(e)}")
            raise

    def _extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract features from raw data"""
        features = pd.DataFrame()

        # Text length features
        features['text_length'] = df['body_text'].str.len()
        features['word_count'] = df.get('word_count', df['body_text'].str.split().str.len())

        # Company features
        for company in self.tech_companies:
            features[f'mentions_{company}'] = df['body_text'].str.lower().str.contains(company, regex=False).astype(int)

        # Role features
        for role in self.tech_roles:
            features[f'role_{role.replace(" ", "_")}'] = df['body_text'].str.lower().str.contains(role, regex=False).astype(int)

        # Keyword features
        positive_keywords = ['offer', 'accepted', 'hired', 'passed', 'success']
        for keyword in positive_keywords:
            features[f'pos_{keyword}'] = df['body_text'].str.lower().str.contains(keyword, regex=False).astype(int)

        negative_keywords = ['rejected', 'failed', 'ghosted', 'denied']
        for keyword in negative_keywords:
            features[f'neg_{keyword}'] = df['body_text'].str.lower().str.contains(keyword, regex=False).astype(int)

        # Metadata features (if available)
        if 'metadata' in df.columns:
            features['has_companies'] = df['metadata'].apply(
                lambda x: len(x.get('companies', [])) if isinstance(x, dict) else 0
            )
            features['has_technologies'] = df['metadata'].apply(
                lambda x: len(x.get('technologies', [])) if isinstance(x, dict) else 0
            )

        # Store feature names
        self.feature_names = list(features.columns)

        # Fill any NaN values
        features = features.fillna(0)

        return features

    def predict(
        self,
        company: Optional[str] = None,
        role: Optional[str] = None,
        experience_level: Optional[str] = None,
        interview_topics: List[str] = None,
        preparation_time_weeks: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Predict interview success probability

        Args:
            company: Target company name
            role: Target role/position
            experience_level: junior, mid, senior
            interview_topics: List of interview topics/skills
            preparation_time_weeks: Time spent preparing

        Returns:
            Prediction result with probability and recommendations
        """
        # If model not trained, use rule-based fallback
        if not self.is_trained or self.model is None:
            return self._fallback_prediction(company, role, experience_level, interview_topics, preparation_time_weeks)

        try:
            # Create synthetic text for feature extraction
            text_parts = []
            if company:
                text_parts.append(f"company {company}")
            if role:
                text_parts.append(f"role {role}")
            if interview_topics:
                text_parts.extend(interview_topics)

            synthetic_text = " ".join(text_parts).lower()

            # Create DataFrame for feature extraction
            df_pred = pd.DataFrame({
                'body_text': [synthetic_text],
                'word_count': [len(synthetic_text.split())],
                'metadata': [{'companies': [company] if company else [], 'technologies': interview_topics or []}]
            })

            # Extract features
            X_pred = self._extract_features(df_pred)

            # Ensure all training features are present
            for col in self.feature_names:
                if col not in X_pred.columns:
                    X_pred[col] = 0

            X_pred = X_pred[self.feature_names]

            # Make prediction
            prob = self.model.predict_proba(X_pred)[0][1]  # Probability of positive outcome

            # Generate recommendations
            recommendations = self._generate_recommendations(
                prob, company, role, experience_level, interview_topics, preparation_time_weeks
            )

            # Calculate confidence based on training data size
            confidence = min(0.95, 0.5 + (self.training_samples / 1000) * 0.45)

            return {
                'success_probability': float(prob),
                'confidence': float(confidence),
                'factors': {
                    'company': company,
                    'role': role,
                    'experience_level': experience_level,
                    'topics_covered': len(interview_topics) if interview_topics else 0,
                    'preparation_weeks': preparation_time_weeks
                },
                'recommendations': recommendations
            }

        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            return self._fallback_prediction(company, role, experience_level, interview_topics, preparation_time_weeks)

    def _fallback_prediction(
        self,
        company: Optional[str],
        role: Optional[str],
        experience_level: Optional[str],
        interview_topics: List[str],
        preparation_time_weeks: Optional[int]
    ) -> Dict[str, Any]:
        """Rule-based prediction when ML model is unavailable"""

        base_prob = 0.5
        adjustments = []

        # Company factor
        if company and company.lower() in ['google', 'meta', 'amazon', 'microsoft', 'apple']:
            base_prob -= 0.1
            adjustments.append("Top-tier company: slightly lower success rate")
        else:
            adjustments.append("Company factor: neutral")

        # Preparation time
        if preparation_time_weeks:
            if preparation_time_weeks >= 8:
                base_prob += 0.15
                adjustments.append("Excellent preparation time (+15%)")
            elif preparation_time_weeks >= 4:
                base_prob += 0.08
                adjustments.append("Good preparation time (+8%)")

        # Interview topics
        if interview_topics and len(interview_topics) >= 5:
            base_prob += 0.1
            adjustments.append("Well-prepared on multiple topics (+10%)")

        # Experience level
        if experience_level == 'senior':
            base_prob += 0.05
            adjustments.append("Senior level: slight advantage")

        base_prob = max(0.0, min(1.0, base_prob))

        recommendations = self._generate_recommendations(
            base_prob, company, role, experience_level, interview_topics, preparation_time_weeks
        )

        return {
            'success_probability': base_prob,
            'confidence': 0.6,  # Lower confidence for rule-based
            'factors': {
                'company': company,
                'role': role,
                'experience_level': experience_level,
                'topics_covered': len(interview_topics) if interview_topics else 0,
                'preparation_weeks': preparation_time_weeks,
                'adjustments': adjustments
            },
            'recommendations': recommendations
        }

    def _generate_recommendations(
        self,
        probability: float,
        company: Optional[str],
        role: Optional[str],
        experience_level: Optional[str],
        interview_topics: List[str],
        preparation_time_weeks: Optional[int]
    ) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []

        if probability < 0.4:
            recommendations.append("Consider extending your preparation time")
            recommendations.append("Focus on fundamental concepts and common interview patterns")
            recommendations.append("Practice mock interviews to build confidence")
        elif probability < 0.6:
            recommendations.append("Review company-specific interview formats and expectations")
            recommendations.append("Strengthen weak areas identified in your preparation")
        else:
            recommendations.append("You're well-prepared! Focus on behavioral questions")
            recommendations.append("Review your past projects and be ready to discuss them in detail")

        if not interview_topics or len(interview_topics) < 3:
            recommendations.append("Expand your preparation to cover more relevant topics")

        if company and company.lower() in ['google', 'meta', 'amazon']:
            recommendations.append(f"Research {company}'s leadership principles and company culture")

        if role and 'engineer' in role.lower():
            recommendations.append("Practice system design and coding problems daily")

        return recommendations


class SkillGapAnalyzer:
    """
    Analyzes skill gaps between user's current skills and target role requirements
    """

    def __init__(self):
        self.skill_frequency: Dict[str, int] = {}
        self.role_skills: Dict[str, List[str]] = {}
        self.training_samples = 0
        self.last_trained: Optional[str] = None
        self.feature_names: List[str] = ['skill_frequency', 'role_requirements']

    def fit(self, df: pd.DataFrame):
        """Build skill frequency database from training data"""
        try:
            logger.info("Building skill frequency database...")

            # Extract skills from metadata
            all_skills = []
            for _, row in df.iterrows():
                metadata = row.get('metadata', {})
                if isinstance(metadata, dict) and 'technologies' in metadata:
                    all_skills.extend([s.lower() for s in metadata['technologies']])

            # Calculate frequency
            from collections import Counter
            self.skill_frequency = dict(Counter(all_skills))

            self.training_samples = len(df)
            self.last_trained = datetime.utcnow().isoformat()

            logger.info(f"✅ Analyzed {len(self.skill_frequency)} unique skills")

        except Exception as e:
            logger.error(f"Skill analyzer fit error: {str(e)}")

    def analyze(
        self,
        user_skills: List[str],
        target_role: str,
        target_companies: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Analyze skill gaps for target role

        Args:
            user_skills: List of user's current skills
            target_role: Target job role
            target_companies: Optional list of target companies

        Returns:
            Analysis with missing skills and learning recommendations
        """
        # Common skill requirements by role
        role_requirements = self._get_role_requirements(target_role)

        # User's skills (normalized)
        user_skills_normalized = set(s.lower().strip() for s in user_skills)

        # Find missing skills
        missing_skills = []
        for skill in role_requirements:
            if skill.lower() not in user_skills_normalized:
                importance = self.skill_frequency.get(skill.lower(), 1)
                missing_skills.append({
                    'skill': skill,
                    'importance': min(100, importance * 10),  # Scale to 0-100
                    'frequency': importance
                })

        # Sort by importance
        missing_skills.sort(key=lambda x: x['importance'], reverse=True)

        # Identify priority skills (top 5)
        priority_skills = [s['skill'] for s in missing_skills[:5]]

        # Generate learning path
        learning_path = self._generate_learning_path(missing_skills[:10])

        # Estimate time
        estimated_weeks = len(priority_skills) * 2  # 2 weeks per skill

        return {
            'missing_skills': missing_skills,
            'priority_skills': priority_skills,
            'learning_path': learning_path,
            'estimated_time_weeks': estimated_weeks
        }

    def _get_role_requirements(self, role: str) -> List[str]:
        """Get common skill requirements for a role"""
        role_lower = role.lower()

        # Define skill sets for common roles
        skill_sets = {
            'software engineer': [
                'Python', 'Java', 'JavaScript', 'TypeScript', 'SQL',
                'Git', 'REST API', 'Docker', 'AWS', 'System Design',
                'Data Structures', 'Algorithms', 'Testing'
            ],
            'data scientist': [
                'Python', 'R', 'SQL', 'Machine Learning', 'Statistics',
                'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch',
                'Data Visualization', 'A/B Testing', 'Feature Engineering'
            ],
            'data engineer': [
                'Python', 'SQL', 'Spark', 'Kafka', 'Airflow',
                'ETL', 'Data Warehousing', 'AWS', 'Docker', 'Kubernetes',
                'Data Modeling', 'Data Pipeline'
            ],
            'frontend developer': [
                'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular',
                'HTML', 'CSS', 'Webpack', 'REST API', 'Git',
                'Responsive Design', 'Testing'
            ],
            'backend developer': [
                'Python', 'Java', 'Node.js', 'SQL', 'NoSQL',
                'REST API', 'GraphQL', 'Microservices', 'Docker', 'AWS',
                'System Design', 'Caching', 'Message Queues'
            ],
            'product manager': [
                'Product Strategy', 'User Research', 'A/B Testing',
                'SQL', 'Data Analysis', 'Roadmapping', 'Agile',
                'Stakeholder Management', 'Metrics', 'Prioritization'
            ]
        }

        # Find matching role
        for key, skills in skill_sets.items():
            if key in role_lower:
                return skills

        # Default fallback
        return skill_sets.get('software engineer', [])

    def _generate_learning_path(self, missing_skills: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate structured learning path for missing skills"""
        learning_path = []

        for i, skill_info in enumerate(missing_skills, 1):
            skill = skill_info['skill']

            learning_path.append({
                'step': i,
                'skill': skill,
                'resources': self._get_learning_resources(skill),
                'estimated_hours': self._estimate_learning_time(skill),
                'priority': 'high' if i <= 3 else 'medium' if i <= 7 else 'low'
            })

        return learning_path

    def _get_learning_resources(self, skill: str) -> List[str]:
        """Get learning resources for a skill"""
        # Simplified resource recommendations
        resources = {
            'python': ['Python.org Tutorial', 'Real Python', 'Python for Everybody'],
            'javascript': ['MDN Web Docs', 'JavaScript.info', 'Eloquent JavaScript'],
            'react': ['React Official Docs', 'React Tutorial', 'Full Stack Open'],
            'sql': ['SQLBolt', 'Mode Analytics SQL Tutorial', 'LeetCode SQL'],
            'machine learning': ['Coursera ML Course', 'Fast.ai', 'Kaggle Learn'],
            'system design': ['System Design Primer', 'Grokking System Design', 'ByteByteGo'],
            'docker': ['Docker Docs', 'Docker for Beginners', 'Play with Docker'],
            'aws': ['AWS Free Tier', 'AWS Certified Cloud Practitioner', 'A Cloud Guru']
        }

        skill_lower = skill.lower()
        for key, res in resources.items():
            if key in skill_lower:
                return res

        return ['Online tutorials', 'Official documentation', 'Hands-on projects']

    def _estimate_learning_time(self, skill: str) -> int:
        """Estimate learning time in hours for a skill"""
        # Simplified estimates
        complex_skills = ['machine learning', 'system design', 'data structures', 'algorithms']
        moderate_skills = ['python', 'java', 'javascript', 'react', 'sql']

        skill_lower = skill.lower()

        if any(cs in skill_lower for cs in complex_skills):
            return 80  # 80 hours for complex skills
        elif any(ms in skill_lower for ms in moderate_skills):
            return 40  # 40 hours for moderate skills
        else:
            return 20  # 20 hours for simpler skills
