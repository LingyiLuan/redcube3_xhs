-- Check if vector columns exist in scraped_posts
SELECT 
    column_name, 
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'scraped_posts' 
  AND column_name IN ('embedding', 'title_embedding')
ORDER BY column_name;

-- Check if vector columns exist in interview_questions
SELECT 
    column_name, 
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'interview_questions' 
  AND column_name = 'embedding';
