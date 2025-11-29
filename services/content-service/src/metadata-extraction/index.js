/**
 * Metadata Extraction Service - Main Entry Point
 * Can be used as a standalone service or imported as a module
 */

const MetadataExtractor = require('./services/metadataExtractor');

// Example usage
function main() {
  const extractor = new MetadataExtractor();

  // Example post
  const examplePost = {
    title: 'Failed Google L4 System Design Interview',
    body_text: `
      I just failed my Google SWE L4 interview. I prepared for 3 months,
      did 300 LeetCode problems, but the system design round killed me.
      They asked me to design a distributed cache and I couldn't explain
      the tradeoffs between consistency and availability well enough.
      I have 4 years of experience with Python and React.
      Any advice for next time?
    `,
    comments: [
      { text: 'Did you study Grokking the System Design Interview?' },
      { text: 'L4 system design is tough. Focus on CAP theorem.' },
    ],
  };

  console.log('=== Metadata Extraction Service ===\n');
  console.log('Input Post:');
  console.log('Title:', examplePost.title);
  console.log('\nExtracted Metadata:');

  const metadata = extractor.extractAll(examplePost);
  console.log(JSON.stringify(metadata, null, 2));

  return metadata;
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for use as module
module.exports = {
  MetadataExtractor,
  extractMetadata: (post) => {
    const extractor = new MetadataExtractor();
    return extractor.extractAll(post);
  },
};
