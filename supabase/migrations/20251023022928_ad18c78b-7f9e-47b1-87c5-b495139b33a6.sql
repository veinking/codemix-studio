-- Add metadata columns to shared_code table
ALTER TABLE shared_code 
  ADD COLUMN category TEXT,
  ADD COLUMN description TEXT,
  ADD COLUMN tags TEXT[];

-- Add check constraint for valid categories
ALTER TABLE shared_code 
  ADD CONSTRAINT valid_category 
  CHECK (category IN (
    'data-analysis',
    'machine-learning',
    'visualization',
    'web-scraping',
    'utility',
    'education',
    'game',
    'other'
  ));

-- Add comment for documentation
COMMENT ON COLUMN shared_code.category IS 'Category of the shared code for better organization';
COMMENT ON COLUMN shared_code.description IS 'Description of what the code does (10-200 chars)';
COMMENT ON COLUMN shared_code.tags IS 'Tags/keywords for the code (max 5)';