"""
Database utilities for prediction service
Connects to PostgreSQL and loads training data from scraped_posts table
"""

import psycopg2
import pandas as pd
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def get_db_connection():
    """Create PostgreSQL database connection"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'postgres'),
        port=os.getenv('DB_PORT', '5432'),
        database=os.getenv('DB_NAME', 'redcube_content'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'postgres')
    )


def get_training_data(min_confidence: float = 0.5) -> Optional[pd.DataFrame]:
    """
    Load training data from scraped_posts table

    Args:
        min_confidence: Minimum confidence score for including posts

    Returns:
        DataFrame with training data or None if no data available
    """
    try:
        conn = get_db_connection()

        query = """
            SELECT
                post_id,
                title,
                body_text,
                potential_outcome,
                confidence_score,
                subreddit,
                metadata,
                word_count,
                created_at,
                scraped_at
            FROM scraped_posts
            WHERE potential_outcome IN ('positive', 'negative')
              AND confidence_score >= %s
            ORDER BY scraped_at DESC
        """

        df = pd.read_sql_query(query, conn, params=(min_confidence,))
        conn.close()

        if len(df) == 0:
            logger.warning("No training data found in database")
            return None

        logger.info(f"Loaded {len(df)} training samples")
        logger.info(f"Distribution: {df['potential_outcome'].value_counts().to_dict()}")

        # Parse JSON metadata if it exists
        if 'metadata' in df.columns:
            df['metadata'] = df['metadata'].apply(lambda x: x if isinstance(x, dict) else {})

        return df

    except Exception as e:
        logger.error(f"Error loading training data: {str(e)}")
        return None


def get_scraped_posts_count() -> dict:
    """Get count of scraped posts by outcome"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                potential_outcome,
                COUNT(*) as count,
                AVG(confidence_score) as avg_confidence
            FROM scraped_posts
            GROUP BY potential_outcome
        """)

        results = cursor.fetchall()
        conn.close()

        return {
            row[0]: {
                'count': row[1],
                'avg_confidence': float(row[2]) if row[2] else 0
            }
            for row in results
        }

    except Exception as e:
        logger.error(f"Error getting post counts: {str(e)}")
        return {}


def get_skill_frequency_data() -> pd.DataFrame:
    """
    Extract skill/technology frequency from scraped posts metadata

    Returns:
        DataFrame with skills and their frequency across positive outcomes
    """
    try:
        conn = get_db_connection()

        query = """
            SELECT
                metadata,
                potential_outcome
            FROM scraped_posts
            WHERE metadata IS NOT NULL
              AND potential_outcome IN ('positive', 'negative')
        """

        df = pd.read_sql_query(query, conn)
        conn.close()

        # Extract technologies from metadata
        skills_data = []
        for _, row in df.iterrows():
            metadata = row['metadata']
            if isinstance(metadata, dict) and 'technologies' in metadata:
                for skill in metadata['technologies']:
                    skills_data.append({
                        'skill': skill.lower(),
                        'outcome': row['potential_outcome']
                    })

        if not skills_data:
            return pd.DataFrame(columns=['skill', 'positive_count', 'negative_count', 'success_rate'])

        skills_df = pd.DataFrame(skills_data)

        # Calculate frequency and success rate
        skill_stats = skills_df.groupby('skill')['outcome'].value_counts().unstack(fill_value=0)
        skill_stats['total'] = skill_stats.sum(axis=1)
        skill_stats['success_rate'] = skill_stats.get('positive', 0) / skill_stats['total']

        return skill_stats.reset_index()

    except Exception as e:
        logger.error(f"Error getting skill frequency data: {str(e)}")
        return pd.DataFrame()
