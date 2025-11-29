/**
 * Constants for metadata extraction
 * Includes role types, levels, companies, and tech stack dictionaries
 */

// Role type mappings
const ROLE_PATTERNS = {
  // Software Engineering
  SWE: [
    /\bsoftware engineer\b/i,
    /\bswe\b/i,
    /\bsoftware dev\b/i,
    /\bengineering role\b/i,
  ],
  SDE: [
    /\bsde\b/i,
    /\bsoftware development engineer\b/i,
  ],
  Frontend: [
    /\bfrontend\b/i,
    /\bfront-end\b/i,
    /\bfront end\b/i,
    /\bui engineer\b/i,
    /\breact developer\b/i,
  ],
  Backend: [
    /\bbackend\b/i,
    /\bback-end\b/i,
    /\bback end\b/i,
    /\bserver\s*side\b/i,
  ],
  Fullstack: [
    /\bfull\s*stack\b/i,
    /\bfull-stack\b/i,
    /\bfullstack\b/i,
  ],
  Mobile: [
    /\bmobile\s*engineer\b/i,
    /\bios\s*engineer\b/i,
    /\bandroid\s*engineer\b/i,
    /\bmobile\s*dev\b/i,
  ],

  // ML/AI
  MLE: [
    /\bmachine learning engineer\b/i,
    /\bml engineer\b/i,
    /\bmle\b/i,
  ],
  'Research': [
    /\bresearch\s*scientist\b/i,
    /\bai\s*researcher\b/i,
    /\bml\s*researcher\b/i,
  ],
  'Applied Scientist': [
    /\bapplied\s*scientist\b/i,
  ],
  'LLM Engineer': [
    /\bllm\s*engineer\b/i,
    /\blarge\s*language\s*model\b/i,
    /\bgenerative\s*ai\b/i,
  ],

  // Data
  'Data Engineer': [
    /\bdata\s*engineer\b/i,
    /\bdata\s*engineering\b/i,
  ],
  'Data Scientist': [
    /\bdata\s*scientist\b/i,
    /\bdata\s*science\b/i,
  ],
  'Analytics Engineer': [
    /\banalytics\s*engineer\b/i,
  ],

  // Infrastructure
  DevOps: [
    /\bdevops\b/i,
    /\bdev\s*ops\b/i,
  ],
  SRE: [
    /\bsre\b/i,
    /\bsite\s*reliability\b/i,
  ],
  'Cloud Engineer': [
    /\bcloud\s*engineer\b/i,
  ],

  // Product
  PM: [
    /\bproduct\s*manager\b/i,
    /\bpm\b(?!\s*(am|pm))/i, // PM but not time
  ],
  TPM: [
    /\btpm\b/i,
    /\btechnical\s*program\s*manager\b/i,
  ],

  // Leadership
  EM: [
    /\bengineering\s*manager\b/i,
    /\bem\b(?!\s*\d)/i, // EM but not EM1, EM2
  ],
};

// Level patterns
const LEVEL_PATTERNS = {
  // Standard levels
  L1: [/\bl1\b/i, /\blevel\s*1\b/i],
  L2: [/\bl2\b/i, /\blevel\s*2\b/i],
  L3: [/\bl3\b/i, /\blevel\s*3\b/i, /\bnew\s*grad\b/i, /\bentry\s*level\b/i],
  L4: [/\bl4\b/i, /\blevel\s*4\b/i, /\bsenior\b/i],
  L5: [/\bl5\b/i, /\blevel\s*5\b/i, /\bstaff\b/i],
  L6: [/\bl6\b/i, /\blevel\s*6\b/i, /\bsenior\s*staff\b/i],
  L7: [/\bl7\b/i, /\blevel\s*7\b/i, /\bprincipal\b/i],
  L8: [/\bl8\b/i, /\blevel\s*8\b/i, /\bdistinguished\b/i],

  // Amazon-specific
  'SDE 1': [/\bsde\s*1\b/i, /\bsde1\b/i],
  'SDE 2': [/\bsde\s*2\b/i, /\bsde2\b/i],
  'SDE 3': [/\bsde\s*3\b/i, /\bsde3\b/i],

  // Meta-specific
  E3: [/\be3\b/i],
  E4: [/\be4\b/i],
  E5: [/\be5\b/i],
  E6: [/\be6\b/i],
  E7: [/\be7\b/i],
  E8: [/\be8\b/i],

  // General descriptors
  'Junior': [/\bjunior\b/i],
  'Mid': [/\bmid\s*level\b/i, /\bmid-level\b/i],
  'Senior': [/\bsenior\b/i, /\bsr\./i],
  'Staff': [/\bstaff\b/i],
  'Principal': [/\bprincipal\b/i],
};

// Map company-specific levels to standard
const LEVEL_NORMALIZATION = {
  'SDE 1': 'L3',
  'SDE 2': 'L4',
  'SDE 3': 'L5',
  'E3': 'L3',
  'E4': 'L4',
  'E5': 'L5',
  'E6': 'L6',
  'E7': 'L7',
  'E8': 'L8',
  'Junior': 'L2',
  'Mid': 'L3',
  'Senior': 'L4',
  'Staff': 'L5',
  'Principal': 'L7',
  'New Grad': 'L3',
};

// Company patterns
const COMPANY_PATTERNS = {
  Google: [/\bgoogle\b/i, /\babc\b/i],
  Meta: [/\bmeta\b/i, /\bfacebook\b/i, /\bfb\b/i],
  Amazon: [/\bamazon\b/i, /\baws\b/i, /\bamzn\b/i],
  Microsoft: [/\bmicrosoft\b/i, /\bmsft\b/i],
  Apple: [/\bapple\b/i],
  Netflix: [/\bnetflix\b/i],
  Tesla: [/\btesla\b/i],
  Uber: [/\buber\b/i],
  Airbnb: [/\bairbnb\b/i],
  Lyft: [/\blyft\b/i],
  Stripe: [/\bstripe\b/i],
  Databricks: [/\bdatabricks\b/i],
  Snowflake: [/\bsnowflake\b/i],
  Coinbase: [/\bcoinbase\b/i],
  Salesforce: [/\bsalesforce\b/i],
  Oracle: [/\boracle\b/i],
  IBM: [/\bibm\b/i],
  LinkedIn: [/\blinkedin\b/i],
  Twitter: [/\btwitter\b/i, /\bx corp\b/i],
  Snap: [/\bsnap\b/i, /\bsnapchat\b/i],
  Pinterest: [/\bpinterest\b/i],
  Reddit: [/\breddit\b/i],
  Discord: [/\bdiscord\b/i],
  Roblox: [/\broblox\b/i],
  'Two Sigma': [/\btwo\s*sigma\b/i],
  'Jane Street': [/\bjane\s*street\b/i],
  Citadel: [/\bcitadel\b/i],
  'Hudson River Trading': [/\bhrt\b/i, /\bhudson\s*river\s*trading\b/i],
};

// Interview stage patterns
const INTERVIEW_STAGE_PATTERNS = {
  phone_screen: [
    /\bphone\s*screen/i,
    /\bphone\s*interview/i,
    /\brecruiter\s*screen/i,
    /\brecruiter\s*call/i,
  ],
  coding: [
    /\bcoding\s*round/i,
    /\bcoding\s*interview/i,
    /\bleetcode\s*round/i,
    /\balgorithm\s*interview/i,
    /\bds\s*&\s*algo/i,
  ],
  system_design: [
    /\bsystem\s*design/i,
    /\barchitecture\s*round/i,
    /\bdesign\s*interview/i,
    /\bhigh\s*level\s*design/i,
  ],
  behavioral: [
    /\bbehavioral/i,
    /\bleadership\s*round/i,
    /\bculture\s*fit/i,
    /\bbar\s*raiser/i,
  ],
  onsite: [
    /\bonsite/i,
    /\bon-site/i,
    /\bfinal\s*round/i,
    /\bvirtual\s*onsite/i,
  ],
  offer: [
    /\boffer/i,
    /\bgot\s*the\s*offer/i,
    /\breceived\s*offer/i,
  ],
};

// Outcome patterns
const OUTCOME_PATTERNS = {
  passed: [
    /\bpassed/i,
    /\baccepted/i,
    /\bgot\s*in/i,
    /\bgot\s*the\s*job/i,
    /\breceived\s*offer/i,
    /\bgot\s*offer/i,
  ],
  rejected: [
    /\brejected/i,
    /\bfailed/i,
    /\bdidn't\s*pass/i,
    /\bdidn't\s*get/i,
    /\bgot\s*rejected/i,
    /\bno\s*offer/i,
  ],
  pending: [
    /\bwaiting/i,
    /\bpending/i,
    /\bin\s*process/i,
  ],
};

// Tech stack patterns
const TECH_STACK_PATTERNS = {
  // Languages
  Python: [/\bpython\b/i],
  JavaScript: [/\bjavascript\b/i, /\bjs\b/i],
  TypeScript: [/\btypescript\b/i, /\bts\b/i],
  Java: [/\bjava\b/i],
  'C++': [/\bc\+\+/i, /\bcpp\b/i],
  Go: [/\bgolang\b/i, /\bgo\b/i],
  Rust: [/\brust\b/i],
  Ruby: [/\bruby\b/i],
  Swift: [/\bswift\b/i],
  Kotlin: [/\bkotlin\b/i],
  SQL: [/\bsql\b/i],

  // Frontend Frameworks
  React: [/\breact\b/i, /\breactjs\b/i],
  Vue: [/\bvue\b/i, /\bvuejs\b/i],
  Angular: [/\bangular\b/i],
  Svelte: [/\bsvelte\b/i],

  // Backend Frameworks
  Django: [/\bdjango\b/i],
  Flask: [/\bflask\b/i],
  FastAPI: [/\bfastapi\b/i],
  'Node.js': [/\bnode\.?js\b/i, /\bnodejs\b/i],
  Express: [/\bexpress\b/i],
  'Spring Boot': [/\bspring\s*boot\b/i],

  // Databases
  PostgreSQL: [/\bpostgres\b/i, /\bpostgresql\b/i],
  MySQL: [/\bmysql\b/i],
  MongoDB: [/\bmongodb\b/i, /\bmongo\b/i],
  Redis: [/\bredis\b/i],
  Cassandra: [/\bcassandra\b/i],

  // Cloud & Infrastructure
  AWS: [/\baws\b/i, /\bamazon\s*web\s*services\b/i],
  Azure: [/\bazure\b/i],
  GCP: [/\bgcp\b/i, /\bgoogle\s*cloud\b/i],
  Docker: [/\bdocker\b/i],
  Kubernetes: [/\bkubernetes\b/i, /\bk8s\b/i],

  // ML/AI
  TensorFlow: [/\btensorflow\b/i],
  PyTorch: [/\bpytorch\b/i],
  'scikit-learn': [/\bscikit\b/i, /\bsklearn\b/i],
  Keras: [/\bkeras\b/i],
};

module.exports = {
  ROLE_PATTERNS,
  LEVEL_PATTERNS,
  LEVEL_NORMALIZATION,
  COMPANY_PATTERNS,
  INTERVIEW_STAGE_PATTERNS,
  OUTCOME_PATTERNS,
  TECH_STACK_PATTERNS,
};
