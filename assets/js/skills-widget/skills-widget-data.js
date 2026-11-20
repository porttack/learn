/* Copied unchanged from porttack.com/assets/skills-widget-data.js on 2026-11-20 by tools/sync_skills_widget.sh. Edit it there, not here. */
/*
 * skills-widget-data.js — the WEF "Skills <-> Standards" dataset.
 *
 * Static, reusable content for the skills-widget engine: the two WEF skill
 * lists, the shared skill/standard mapping, and the CTE / CSTA / CSTA 2026
 * match-up data, plus a canonical set of captions. Loaded after
 * skills-widget.js; registers itself as the "wef-skills" dataset so posts can
 * pull it in with { dataset: "wef-skills" } instead of carrying the data
 * inline. Posts may override individual captions in their init() call.
 */
(function (SW) {
  "use strict";
  if (!SW || !SW.registerDataset) return;

  // % of employers calling each a core skill (WEF Fig. 3.3), full top 10.
  // Verified in WEF text: analytical (7 in 10), resilience 67, curiosity 50.
  // Ranks 6-10 read from Fig 3.3 - spot-check against the report PDF before publishing.
  var NOW = [
    {name:"Analytical thinking", val:69, cls:"tech"},
    {name:"Resilience, flexibility & agility", val:67, cls:"human"},
    {name:"Leadership & social influence", val:61, cls:"human"},
    {name:"Creative thinking", val:57, cls:"human"},
    {name:"Motivation & self-awareness", val:52, cls:"human"},
    {name:"Technological literacy", val:51, cls:"tech"},
    {name:"Empathy & active listening", val:50, cls:"human"},
    {name:"Curiosity & lifelong learning", val:50, cls:"human"},
    {name:"Talent management", val:47, cls:"human"},
    {name:"Service orientation & customer service", val:47, cls:"human"}
  ];

  // Fastest-growing skills to 2030, WEF's ranked order (Fig. 3.4). Shown as rank, not %.
  // rank2025 tracks where each skill ranked in the "today" view for comparison.
  var GROWING = [
    {name:"AI & big data", cls:"ai", rank2025: null},
    {name:"Networks & cybersecurity", cls:"tech", rank2025: null},
    {name:"Technological literacy", cls:"tech", rank2025: 6},
    {name:"Creative thinking", cls:"human", rank2025: 4},
    {name:"Resilience, flexibility & agility", cls:"human", rank2025: 2},
    {name:"Curiosity & lifelong learning", cls:"human", rank2025: 8},
    {name:"Leadership & social influence", cls:"human", rank2025: 3},
    {name:"Talent management", cls:"human", rank2025: 9},
    {name:"Analytical thinking", cls:"tech", rank2025: 1},
    {name:"Environmental stewardship", cls:"tech", rank2025: null}
  ];

  // Union of both WEF lists, mapped to the CA CTE knowledge and performance
  // anchor standards (2013, ICT sector edition). rank = 2025 "today" rank;
  // null means the skill appears only on the 2030 fastest-growing list.
  // fit: strong = named at anchor level; partial = sub-standards; gap = thin/missing.
  var CTE = [
    {name:"Analytical thinking", cls:"tech", rank:1, std:"<b>5.0</b> Problem Solving &amp; Critical Thinking; <b>1.0</b> Academics", fit:"strong"},
    {name:"Resilience, flexibility & agility", cls:"human", rank:2, std:"<b>7.0</b> Responsibility &amp; Flexibility", fit:"strong"},
    {name:"Leadership & social influence", cls:"human", rank:3, std:"<b>9.0</b> Leadership &amp; Teamwork", fit:"strong"},
    {name:"Creative thinking", cls:"human", rank:4, std:"<b>11.3&ndash;11.4</b> innovation &amp; entrepreneurship only", fit:"partial"},
    {name:"Motivation & self-awareness", cls:"human", rank:5, std:"<b>3.2</b> personal character traits &amp; career success", fit:"partial"},
    {name:"Technological literacy", cls:"tech", rank:6, std:"<b>4.0</b> Technology; <b>10.0</b> Technical Knowledge &amp; Skills", fit:"strong"},
    {name:"Empathy & active listening", cls:"human", rank:7, std:"<b>2.3</b> verbal &amp; nonverbal communication; <b>9.6</b> respect for differences", fit:"partial"},
    {name:"Curiosity & lifelong learning", cls:"human", rank:8, std:"<b>3.0</b> Career Planning; <b>11.2</b> continued learning", fit:"partial"},
    {name:"Talent management", cls:"human", rank:9, std:"<b>9.1&ndash;9.2</b> leadership &amp; team development", fit:"partial"},
    {name:"Service orientation & customer service", cls:"human", rank:10, std:"<b>2.8</b> customer-oriented service approach to users", fit:"partial"},
    {name:"AI & big data", cls:"ai", rank:null, std:"<b>4.5</b> \"projected technological advances\" at best", fit:"gap"},
    {name:"Networks & cybersecurity", cls:"tech", rank:null, std:"<b>10.8</b> security concepts (ICT pathways)", fit:"strong"},
    {name:"Environmental stewardship", cls:"tech", rank:null, std:"<b>6.9&ndash;6.11</b> e-waste, resources, energy", fit:"partial"}
  ];

  // The eleven CTE knowledge and performance anchor standards.
  var CTE_ANCHORS = [
    {id:"1", disp:"1.0", name:"Academics", cls:"tech"},
    {id:"2", disp:"2.0", name:"Communications", cls:"human"},
    {id:"3", disp:"3.0", name:"Career Planning &amp; Management", cls:"human"},
    {id:"4", disp:"4.0", name:"Technology", cls:"tech"},
    {id:"5", disp:"5.0", name:"Problem Solving &amp; Critical Thinking", cls:"tech"},
    {id:"6", disp:"6.0", name:"Health &amp; Safety", cls:"tech"},
    {id:"7", disp:"7.0", name:"Responsibility &amp; Flexibility", cls:"human"},
    {id:"8", disp:"8.0", name:"Ethics &amp; Legal Responsibilities", cls:"human"},
    {id:"9", disp:"9.0", name:"Leadership &amp; Teamwork", cls:"human"},
    {id:"10", disp:"10.0", name:"Technical Knowledge &amp; Skills", cls:"tech"},
    {id:"11", disp:"11.0", name:"Demonstration &amp; Application", cls:"human"}
  ];

  // Lines for the CTE match-up: s = index into CTE, a = anchor id.
  // w: "strong" draws solid, "partial" draws dashed. Skills with no entry
  // (AI & big data) are the gaps and get no line.
  var CTE_LINKS = [
    {s:0, a:"5", w:"strong"}, {s:0, a:"1", w:"partial"},
    {s:1, a:"7", w:"strong"},
    {s:2, a:"9", w:"strong"},
    {s:3, a:"11", w:"partial"},
    {s:4, a:"3", w:"partial"},
    {s:5, a:"4", w:"strong"}, {s:5, a:"10", w:"strong"},
    {s:6, a:"2", w:"partial"}, {s:6, a:"9", w:"partial"},
    {s:7, a:"3", w:"partial"}, {s:7, a:"11", w:"partial"},
    {s:8, a:"9", w:"partial"},
    {s:9, a:"2", w:"partial"},
    {s:11, a:"10", w:"strong"},
    {s:12, a:"6", w:"partial"}
  ];

  // Full text of each anchor standard, quoted from the CDE ICT sector edition
  // (2013), with the ELA alignment notes dropped and the sector name
  // abbreviated to ICT. 6.6 and 6.8 really are identical in the source.
  var ANCHOR_DETAILS = {
    1: {desc:"Analyze and apply appropriate academic standards required for successful industry sector pathway completion leading to postsecondary education and employment. Refer to the ICT academic alignment matrix for identification of standards.", subs:[]},
    2: {desc:"Acquire and accurately use ICT sector terminology and protocols at the career and college readiness level for communicating effectively in oral, written, and multimedia formats.", subs:[
      {n:"2.1", t:"Recognize the elements of communication using a sender-receiver model."},
      {n:"2.2", t:"Identify barriers to accurate and appropriate communication."},
      {n:"2.3", t:"Interpret verbal and nonverbal communications and respond appropriately."},
      {n:"2.4", t:"Demonstrate elements of written and electronic communication such as accurate spelling, grammar, and format."},
      {n:"2.5", t:"Communicate information and ideas effectively to multiple audiences using a variety of media and formats."},
      {n:"2.6", t:"Advocate and practice safe, legal, and responsible use of digital media information and communications technologies."},
      {n:"2.7", t:"Use technical writing and communication skills to work effectively with diverse groups of people."},
      {n:"2.8", t:"Understand the principles of a customer-oriented service approach to users."}
    ]},
    3: {desc:"Integrate multiple sources of career information from diverse formats to make informed career decisions, solve problems, and manage personal career plans.", subs:[
      {n:"3.1", t:"Identify personal interests, aptitudes, information, and skills necessary for informed career decision making."},
      {n:"3.2", t:"Evaluate personal character traits such as trust, respect, and responsibility and understand the impact they can have on career success."},
      {n:"3.3", t:"Explore how information and communication technologies are used in career planning and decision making."},
      {n:"3.4", t:"Research the scope of career opportunities available and the requirements for education, training, certification, and licensure."},
      {n:"3.5", t:"Integrate changing employment trends, societal needs, and economic conditions into career planning."},
      {n:"3.6", t:"Recognize the role and function of professional organizations, industry associations, and organized labor in a productive society."},
      {n:"3.7", t:"Recognize the importance of small business in the California and global economies."},
      {n:"3.8", t:"Understand how digital media are used by potential employers and postsecondary agencies to evaluate candidates."},
      {n:"3.9", t:"Develop a career plan that reflects career interests, pathways, and postsecondary options."}
    ]},
    4: {desc:"Use existing and emerging technology, to investigate, research, and produce products and services, including new information, as required in the ICT sector workplace environment.", subs:[
      {n:"4.1", t:"Use electronic reference materials to gather information and produce products and services."},
      {n:"4.2", t:"Employ technology based communications responsibly and effectively to explore complex systems and issues."},
      {n:"4.3", t:"Use information and communication technologies to synthesize, summarize, compare, and contrast information from multiple sources."},
      {n:"4.4", t:"Discern the quality and value of information collected using digital technologies, and recognize bias and intent of the associated sources."},
      {n:"4.5", t:"Research past, present, and projected technological advances as they impact a particular pathway."},
      {n:"4.6", t:"Assess the value of various information and communication technologies to interact with constituent populations as part of a search of the current literature or in relation to the information task."}
    ]},
    5: {desc:"Conduct short, as well as more sustained, research to create alternative solutions to answer a question or solve a problem unique to the ICT sector using critical and creative thinking, logical reasoning, analysis, inquiry, and problem-solving techniques.", subs:[
      {n:"5.1", t:"Identify and ask significant questions that clarify various points of view to solve problems."},
      {n:"5.2", t:"Solve predictable and unpredictable work-related problems using various types of reasoning (inductive, deductive) as appropriate."},
      {n:"5.3", t:"Use systems thinking to analyze how various components interact with each other to produce outcomes in a complex work environment."},
      {n:"5.4", t:"Interpret information and draw conclusions, based on the best analysis, to make informed decisions."},
      {n:"5.5", t:"Use a logical and structured approach to isolate and identify the source of problems and to resolve problems."},
      {n:"5.6", t:"Know the available resources for identifying and resolving problems."},
      {n:"5.7", t:"Work out problems iteratively and recursively."},
      {n:"5.8", t:"Create and use algorithms and solve problems."},
      {n:"5.9", t:"Deconstruct large problems into components to solve."},
      {n:"5.10", t:"Use multiple layers of abstraction."},
      {n:"5.11", t:"Understand the concept of base systems, including binary and hexadecimal."},
      {n:"5.12", t:"Apply the concepts of Boolean logic to decision making and searching."}
    ]},
    6: {desc:"Demonstrate health and safety procedures, regulations, and personal health practices and determine the meaning of symbols, key terms, and domain-specific words and phrases as related to the ICT sector workplace environment.", subs:[
      {n:"6.1", t:"Locate, and adhere to, Material Safety Data Sheet (MSDS) instructions."},
      {n:"6.2", t:"Interpret policies, procedures, and regulations for the workplace environment, including employer and employee responsibilities."},
      {n:"6.3", t:"Use health and safety practices for storing, cleaning, and maintaining tools, equipment, and supplies."},
      {n:"6.4", t:"Practice personal safety when lifting, bending, or moving equipment and supplies."},
      {n:"6.5", t:"Demonstrate how to prevent and respond to work-related accidents or injuries; this includes demonstrating an understanding of ergonomics."},
      {n:"6.6", t:"Maintain a safe and healthful working environment."},
      {n:"6.7", t:"Be informed of laws/acts pertaining to the Occupational Safety and Health Administration (OSHA)."},
      {n:"6.8", t:"Maintain a safe and healthful working environment."},
      {n:"6.9", t:"Dispose of e-waste properly, understanding the health, environmental, and legal risks of improper disposal."},
      {n:"6.10", t:"Act conscientiously regarding the use of natural resources (e.g., paper, ink, etc.)"},
      {n:"6.11", t:"Conserve energy while computing (e.g., turn off equipment at night, power-saving settings, etc.)"}
    ]},
    7: {desc:"Initiate, and participate in, a range of collaborations demonstrating behaviors that reflect personal and professional responsibility, flexibility, and respect in the ICT sector workplace environment and community settings.", subs:[
      {n:"7.1", t:"Recognize how financial management impacts the economy, workforce, and community."},
      {n:"7.2", t:"Explain the importance of accountability and responsibility in fulfilling personal, community, and workplace roles."},
      {n:"7.3", t:"Understand the need to adapt to changing and varied roles and responsibilities."},
      {n:"7.4", t:"Practice time management and efficiency to fulfill responsibilities."},
      {n:"7.5", t:"Apply high-quality techniques to product or presentation design and development."},
      {n:"7.6", t:"Demonstrate knowledge and practice of responsible financial management."},
      {n:"7.7", t:"Demonstrate the qualities and behaviors that constitute a positive and professional work demeanor, including appropriate attire for the profession."},
      {n:"7.8", t:"Explore issues of global significance and document the impact on the ICT sector."}
    ]},
    8: {desc:"Practice professional, ethical, and legal behavior, responding thoughtfully to diverse perspectives and resolving contradictions when possible, consistent with applicable laws, regulations, and organizational norms.", subs:[
      {n:"8.1", t:"Access, analyze, and implement quality assurance standards of practice."},
      {n:"8.2", t:"Identify local, district, state, and federal regulatory agencies, entities, laws, and regulations related to the ICT industry sector."},
      {n:"8.3", t:"Demonstrate ethical and legal practices consistent with ICT sector workplace standards."},
      {n:"8.4", t:"Explain the importance of personal integrity, confidentiality, and ethical behavior in the workplace."},
      {n:"8.5", t:"Analyze organizational culture and practices within the workplace environment."},
      {n:"8.6", t:"Adhere to copyright and intellectual property laws and regulations, and use and appropriately cite proprietary information."},
      {n:"8.7", t:"Conform to rules and regulations regarding sharing of confidential information, as determined by ICT sector laws and practices."},
      {n:"8.8", t:"Identify legal and ethical issues that have proliferated with increased technology adoption, including hacking, scamming, and breach of privacy."}
    ]},
    9: {desc:"Work with peers to promote divergent and creative perspectives, effective leadership, group dynamics, team and individual decision making, benefits of workforce diversity, and conflict resolution such as those practiced in the Future Business Leaders of America and SkillsUSA career technical student organization.", subs:[
      {n:"9.1", t:"Define leadership and identify the responsibilities, competencies, and behaviors of successful leaders."},
      {n:"9.2", t:"Identify the characteristics of successful teams, including leadership, cooperation, collaboration, and effective decision-making skills as applied in groups, teams, and career technical student organization activities."},
      {n:"9.3", t:"Understand the characteristics and benefits of teamwork, leadership, and citizenship in the school, community, and workplace setting."},
      {n:"9.4", t:"Explain how professional associations and organizations and associated leadership development and competitive career development activities enhance academic preparation, promote career choices, and contribute to employment opportunities."},
      {n:"9.5", t:"Understand that the modern world is an international community and requires an expanded global view."},
      {n:"9.6", t:"Respect individual and cultural differences and recognize the importance of diversity in the workplace."},
      {n:"9.7", t:"Participate in interactive teamwork to solve real ICT sector issues and problems."}
    ]},
    10: {desc:"Apply essential technical knowledge and skills common to all pathways in the ICT sector, following procedures when carrying out experiments or performing technical tasks.", subs:[
      {n:"10.1", t:"Interpret and explain terminology and practices specific to the ICT sector."},
      {n:"10.2", t:"Comply with the rules, regulations, and expectations of all aspects of the ICT sector."},
      {n:"10.3", t:"Construct projects and products specific to the ICT sector requirements and expectations."},
      {n:"10.4", t:"Collaborate with industry experts for specific technical knowledge and skills."},
      {n:"10.5", t:"Understand the major software and hardware components of a computer and a network and how they relate to each other."},
      {n:"10.6", t:"Understand data sizes of various types of information (text, pictures, sound, video, etc.) and data capacity of various forms of media."},
      {n:"10.7", t:"Understand the SI (metric) prefixes commonly used in computing including, at least, kilo, mega, giga, and tera."},
      {n:"10.8", t:"Understand security concepts including authorization, rights, and encryption."},
      {n:"10.9", t:"Use common industry-standard software and their applications including word processing, spreadsheets, databases, and multimedia software."},
      {n:"10.10", t:"Manage files in a hierarchical system."},
      {n:"10.11", t:"Know multiple ways in which to transfer information and resources (e.g., text, data, sound, video, still images) between software programs and systems."},
      {n:"10.12", t:"Know appropriate search procedures for different types of information, sources, and queries."},
      {n:"10.13", t:"Evaluate the accuracy, relevance, and comprehensiveness of retrieved information."},
      {n:"10.14", t:"Analyze the effectiveness of online information resources to support collaborative tasks, research, publications, communications, and increased productivity."}
    ]},
    11: {desc:"Demonstrate and apply the knowledge and skills contained in the ICT anchor standards, pathway standards, and performance indicators in classroom, laboratory, and workplace settings, and through career technical student organizations such as Future Business Leaders of America and SkillsUSA.", subs:[
      {n:"11.1", t:"Utilize work-based/workplace learning experiences to demonstrate and expand upon knowledge and skills gained during classroom instruction and laboratory practices specific to the ICT sector program of study."},
      {n:"11.2", t:"Demonstrate proficiency in a career technical pathway that leads to certification, licensure, and/or continued learning at the postsecondary level."},
      {n:"11.3", t:"Demonstrate entrepreneurship skills and knowledge of self-employment options and innovative ventures."},
      {n:"11.4", t:"Employ entrepreneurial practices and behaviors appropriate to ICT sector opportunities."},
      {n:"11.5", t:"Create a portfolio, or similar collection of work, that offers evidence through assessment and evaluation of skills and knowledge competency as contained in the anchor standards, pathway standards, and performance indicators."}
    ]}
  };

  // Sub-standards the employer-skill mapping points to, keyed by sub-standard
  // number, valued with the WEF skill that lands there. Drives the highlight
  // in the detail panel.
  var COVERED = {
    "2.3":"Empathy & active listening",
    "2.8":"Service orientation",
    "3.2":"Motivation & self-awareness",
    "3.4":"Curiosity & lifelong learning",
    "3.5":"Curiosity & lifelong learning",
    "4.5":"AI & big data (at best)",
    "6.9":"Environmental stewardship",
    "6.10":"Environmental stewardship",
    "6.11":"Environmental stewardship",
    "7.3":"Resilience & flexibility",
    "9.1":"Talent management",
    "9.2":"Talent management",
    "9.6":"Empathy & active listening",
    "9.7":"Leadership & social influence",
    "10.8":"Networks & cybersecurity",
    "11.2":"Curiosity & lifelong learning",
    "11.3":"Creative thinking",
    "11.4":"Creative thinking"
  };

  // The CSTA/CA CS side of the mapping: the seven core practices plus the
  // five concept strands of the California 9-12 core.
  var CSTA_ANCHORS = [
    {id:"P1", disp:"P1", name:"Fostering an Inclusive Computing Culture", unit:"practice", cls:"human"},
    {id:"P2", disp:"P2", name:"Collaborating Around Computing", unit:"practice", cls:"human"},
    {id:"P3", disp:"P3", name:"Recognizing &amp; Defining Computational Problems", unit:"practice", cls:"tech"},
    {id:"P4", disp:"P4", name:"Developing &amp; Using Abstractions", unit:"practice", cls:"tech"},
    {id:"P5", disp:"P5", name:"Creating Computational Artifacts", unit:"practice", cls:"human"},
    {id:"P6", disp:"P6", name:"Testing &amp; Refining Computational Artifacts", unit:"practice", cls:"tech"},
    {id:"P7", disp:"P7", name:"Communicating About Computing", unit:"practice", cls:"human"},
    {id:"CS", disp:"CS", name:"Computing Systems", unit:"strand", cls:"tech"},
    {id:"NI", disp:"NI", name:"Networks &amp; the Internet", unit:"strand", cls:"tech"},
    {id:"DA", disp:"DA", name:"Data &amp; Analysis", unit:"strand", cls:"ai"},
    {id:"AP", disp:"AP", name:"Algorithms &amp; Programming", unit:"strand", cls:"tech"},
    {id:"IC", disp:"IC", name:"Impacts of Computing", unit:"strand", cls:"human"}
  ];

  // Skills with no entry here (motivation, curiosity, environmental
  // stewardship) are the CS-side gaps; note they flip against the CTE map.
  var CSTA_LINKS = [
    {s:0, a:"P3", w:"strong"}, {s:0, a:"P4", w:"strong"},
    {s:1, a:"P6", w:"partial"},
    {s:2, a:"P2", w:"partial"}, {s:2, a:"P7", w:"partial"},
    {s:3, a:"P5", w:"strong"},
    {s:5, a:"CS", w:"strong"}, {s:5, a:"AP", w:"strong"},
    {s:6, a:"P1", w:"strong"},
    {s:8, a:"P2", w:"partial"},
    {s:9, a:"P1", w:"partial"},
    {s:10, a:"DA", w:"strong"},
    {s:11, a:"NI", w:"strong"}
  ];

  // Practice statements quoted from the K-12 Computer Science Framework
  // (end-of-grade-12 expectations); strand standards quoted from the 2018
  // California CS standards, 9-12 core.
  var PRACTICE_DESC = "One of the seven core practices attached to every California CS standard. By the end of Grade 12, students should be able to:";
  var CSTA_DETAILS = {
    P1: {desc: PRACTICE_DESC, subs:[
      {n:"1.1", t:"Include the unique perspectives of others and reflect on one's own perspectives when designing and developing computational products."},
      {n:"1.2", t:"Address the needs of diverse end users during the design process to produce artifacts with broad accessibility and usability."},
      {n:"1.3", t:"Employ self- and peer-advocacy to address bias in interactions, product design, and development methods."}
    ]},
    P2: {desc: PRACTICE_DESC, subs:[
      {n:"2.1", t:"Cultivate working relationships with individuals possessing diverse perspectives, skills, and personalities."},
      {n:"2.2", t:"Create team norms, expectations, and equitable workloads to increase efficiency and effectiveness."},
      {n:"2.3", t:"Solicit and incorporate feedback from, and provide constructive feedback to, team members and other stakeholders."},
      {n:"2.4", t:"Evaluate and select technological tools that can be used to collaborate on a project."}
    ]},
    P3: {desc: PRACTICE_DESC, subs:[
      {n:"3.1", t:"Identify complex, interdisciplinary, real-world problems that can be solved computationally."},
      {n:"3.2", t:"Decompose complex real-world problems into manageable subproblems that could integrate existing solutions or procedures."},
      {n:"3.3", t:"Evaluate whether it is appropriate and feasible to solve a problem computationally."}
    ]},
    P4: {desc: PRACTICE_DESC, subs:[
      {n:"4.1", t:"Extract common features from a set of interrelated processes or complex phenomena."},
      {n:"4.2", t:"Evaluate existing technological functionalities and incorporate them into new designs."},
      {n:"4.3", t:"Create modules and develop points of interaction that can apply to multiple situations and reduce complexity."},
      {n:"4.4", t:"Model phenomena and processes and simulate systems to understand and evaluate potential outcomes."}
    ]},
    P5: {desc: PRACTICE_DESC, subs:[
      {n:"5.1", t:"Plan the development of a computational artifact using an iterative process that includes reflection on and modification of the plan, taking into account key features, time and resource constraints, and user expectations."},
      {n:"5.2", t:"Create a computational artifact for practical intent, personal expression, or to address a societal issue."},
      {n:"5.3", t:"Modify an existing artifact to improve or customize it."}
    ]},
    P6: {desc: PRACTICE_DESC, subs:[
      {n:"6.1", t:"Systematically test computational artifacts by considering all scenarios and using test cases."},
      {n:"6.2", t:"Identify and fix errors using a systematic process."},
      {n:"6.3", t:"Evaluate and refine a computational artifact multiple times to enhance its performance, reliability, usability, and accessibility."}
    ]},
    P7: {desc: PRACTICE_DESC, subs:[
      {n:"7.1", t:"Select, organize, and interpret large data sets from multiple sources to support a claim."},
      {n:"7.2", t:"Describe, justify, and document computational processes and solutions using appropriate terminology consistent with the intended audience and purpose."},
      {n:"7.3", t:"Articulate ideas responsibly by observing intellectual property rights and giving appropriate attribution."}
    ]},
    CS: {desc:"California's three 9-12 core standards for Computing Systems:", subs:[
      {n:"9-12.CS.1", t:"Describe ways in which abstractions hide the underlying implementation details of computing systems to simplify user experiences."},
      {n:"9-12.CS.2", t:"Compare levels of abstraction and interactions between application software, system software, and hardware."},
      {n:"9-12.CS.3", t:"Develop guidelines that convey systematic troubleshooting strategies that others can use to identify and fix errors."}
    ]},
    NI: {desc:"California's four 9-12 core standards for Networks &amp; the Internet:", subs:[
      {n:"9-12.NI.4", t:"Describe issues that impact network functionality."},
      {n:"9-12.NI.5", t:"Describe the design characteristics of the internet."},
      {n:"9-12.NI.6", t:"Compare and contrast security measures to address various security threats."},
      {n:"9-12.NI.7", t:"Compare and contrast cryptographic techniques to model the secure transmission of information."}
    ]},
    DA: {desc:"California's four 9-12 core standards for Data &amp; Analysis. The specialty tier goes further and names artificial intelligence outright (9-12S.AP.10: \"Describe how artificial intelligence drives many software and physical systems\").", subs:[
      {n:"9-12.DA.8", t:"Translate between different representations of data abstractions of real-world phenomena, such as characters, numbers, and images."},
      {n:"9-12.DA.9", t:"Describe tradeoffs associated with how data elements are organized and stored."},
      {n:"9-12.DA.10", t:"Create data visualizations to help others better understand real-world phenomena."},
      {n:"9-12.DA.11", t:"Refine computational models to better represent the relationships among different elements of data collected from a phenomenon or process."}
    ]},
    AP: {desc:"California's eleven 9-12 core standards for Algorithms &amp; Programming:", subs:[
      {n:"9-12.AP.12", t:"Design algorithms to solve computational problems using a combination of original and existing algorithms."},
      {n:"9-12.AP.13", t:"Create more generalized computational solutions using collections instead of repeatedly using simple variables."},
      {n:"9-12.AP.14", t:"Justify the selection of specific control structures by identifying tradeoffs associated with implementation, readability, and performance."},
      {n:"9-12.AP.15", t:"Iteratively design and develop computational artifacts for practical intent, personal expression, or to address a societal issue by using events to initiate instructions."},
      {n:"9-12.AP.16", t:"Decompose problems into smaller subproblems through systematic analysis, using constructs such as procedures, modules, and/or classes."},
      {n:"9-12.AP.17", t:"Create computational artifacts using modular design."},
      {n:"9-12.AP.18", t:"Systematically design programs for broad audiences by incorporating feedback from users."},
      {n:"9-12.AP.19", t:"Explain the limitations of licenses that restrict use of computational artifacts when using resources such as libraries."},
      {n:"9-12.AP.20", t:"Iteratively evaluate and refine a computational artifact to enhance its performance, reliability, usability, and accessibility."},
      {n:"9-12.AP.21", t:"Design and develop computational artifacts working in team roles using collaborative tools."},
      {n:"9-12.AP.22", t:"Document decisions made during the design process using text, graphics, presentations, and/or demonstrations in the development of complex programs."}
    ]},
    IC: {desc:"California's eight 9-12 core standards for Impacts of Computing, the ethics wing of the document:", subs:[
      {n:"9-12.IC.23", t:"Evaluate the ways computing impacts personal, ethical, social, economic, and cultural practices."},
      {n:"9-12.IC.24", t:"Identify impacts of bias and equity deficit on design and implementation of computational artifacts and apply appropriate processes for evaluating issues of bias."},
      {n:"9-12.IC.25", t:"Demonstrate ways a given algorithm applies to problems across disciplines."},
      {n:"9-12.IC.26", t:"Study, discuss, and think critically about the potential impacts and implications of emerging technologies on larger social, economic, and political structures, with evidence from credible sources."},
      {n:"9-12.IC.27", t:"Use collaboration tools and methods to increase connectivity with people of different cultures and careers."},
      {n:"9-12.IC.28", t:"Explain the beneficial and harmful effects that intellectual property laws can have on innovation."},
      {n:"9-12.IC.29", t:"Explain the privacy concerns related to the collection and generation of data through automated processes."},
      {n:"9-12.IC.30", t:"Evaluate the social and economic implications of privacy in the context of safety, law, or ethics."}
    ]}
  };

  var CSTA_COVERED = {
    "1.1":"Empathy & active listening",
    "1.2":"Service orientation",
    "2.2":"Talent management",
    "2.3":"Empathy & active listening",
    "6.3":"Resilience & flexibility",
    "9-12.NI.6":"Networks & cybersecurity",
    "9-12.NI.7":"Networks & cybersecurity",
    "9-12.DA.11":"AI & big data",
    "9-12.AP.15":"Creative thinking",
    "9-12.AP.18":"Service orientation",
    "9-12.AP.21":"Leadership & social influence"
  };

  // The 2026 CSTA PK-12 Computer Science Standards (published July 2026,
  // csteachers.org): four pillars of practices, seven dispositions, five
  // concepts. Pillar and disposition text is quoted verbatim (CC BY-NC-SA
  // 4.0); concept subconcepts are summarized, with codes cited, from Eric's
  // own decoded standards catalog (learn.porttack.com/standards). Ordered to
  // minimize line crossings against the WEF skill list.
  var CSTA3_ANCHORS = [
    {id:"CT", disp:"Pillar", name:"Computational Thinking", unit:"pillar", cls:"tech"},
    {id:"D3", disp:"Disp.", name:"Critical Thinking", unit:"disposition", cls:"tech"},
    {id:"D4", disp:"Disp.", name:"Persistence", unit:"disposition", cls:"human"},
    {id:"INC", disp:"Pillar", name:"Inclusive Collaboration", unit:"pillar", cls:"human"},
    {id:"D1", disp:"Disp.", name:"Creativity", unit:"disposition", cls:"human"},
    {id:"D5", disp:"Disp.", name:"Reflectiveness", unit:"disposition", cls:"human"},
    {id:"D2", disp:"Disp.", name:"Sense of Belonging", unit:"disposition", cls:"human"},
    {id:"PR", disp:"Concept", name:"Programming", unit:"concept", cls:"tech"},
    {id:"HCD", disp:"Pillar", name:"Human-Centered Design", unit:"pillar", cls:"human"},
    {id:"D7", disp:"Disp.", name:"Curiosity", unit:"disposition", cls:"human"},
    {id:"D6", disp:"Disp.", name:"Resourcefulness", unit:"disposition", cls:"human"},
    {id:"AD", disp:"Concept", name:"Algorithms &amp; Design", unit:"concept", cls:"tech"},
    {id:"DA3", disp:"Concept", name:"Data &amp; Analysis", unit:"concept", cls:"ai"},
    {id:"SS", disp:"Concept", name:"Systems &amp; Security", unit:"concept", cls:"tech"},
    {id:"ETH", disp:"Pillar", name:"Ethics &amp; Social Responsibility", unit:"pillar", cls:"human"},
    {id:"CSoc", disp:"Concept", name:"Computing &amp; Society", unit:"concept", cls:"human"}
  ];

  // Every WEF skill has a line against the 2026 standards; the only chip
  // nothing points to is Computing & Society.
  var CSTA3_LINKS = [
    {s:0, a:"CT", w:"strong"}, {s:0, a:"D3", w:"strong"},
    {s:1, a:"D4", w:"strong"},
    {s:2, a:"INC", w:"partial"},
    {s:3, a:"D1", w:"strong"},
    {s:4, a:"D5", w:"strong"}, {s:4, a:"D2", w:"partial"},
    {s:5, a:"PR", w:"strong"}, {s:5, a:"SS", w:"strong"},
    {s:6, a:"HCD", w:"strong"}, {s:6, a:"INC", w:"partial"},
    {s:7, a:"D7", w:"strong"}, {s:7, a:"D6", w:"partial"},
    {s:8, a:"INC", w:"partial"},
    {s:9, a:"HCD", w:"strong"},
    {s:10, a:"DA3", w:"strong"}, {s:10, a:"AD", w:"strong"}, {s:10, a:"PR", w:"partial"},
    {s:11, a:"SS", w:"strong"},
    {s:12, a:"ETH", w:"partial"}
  ];

  var DISP_NOTE = " One of seven dispositions in the 2026 CSTA PK-12 Computer Science Standards: habits of mind that shape how students think, persist, collaborate, and reflect, beyond what they can code or recall.";
  var CSTA3_DETAILS = {
    CT: {desc:"One of four pillars of practices: a way of thinking about problems and formulating problems and solutions so that an information-processing agent can help to solve them. The engineering design process is embedded within this pillar.", subs:[
      {n:"6", t:"Define computational problems."},
      {n:"6.a", t:"Identify real-world problems that can be solved computationally using rule-based approaches, data-driven approaches (e.g., machine learning), or a combination of these approaches."},
      {n:"6.b", t:"Clearly state criteria for success and identify constraints."},
      {n:"6.c", t:"Decompose complex problems into manageable subproblems."},
      {n:"7", t:"Develop and use abstractions."},
      {n:"7.a", t:"Extract common features and patterns from data, processes, or phenomena to create general methods and algorithms."},
      {n:"7.b", t:"Create reusable modules and procedures that can apply to multiple situations to reduce complexity."},
      {n:"7.c", t:"Model phenomena and develop simulations, using rule-based and data-driven approaches, to understand and evaluate potential outcomes."},
      {n:"8", t:"Create computing technologies."},
      {n:"8.a", t:"Generate and evaluate multiple approaches to solving a problem. Determine which solution best meets the defined criteria given the constraints."},
      {n:"8.b", t:"Plan the development of computational solutions."},
      {n:"8.c", t:"Implement solutions by developing or modifying technologies through traditional programming, model training, or a combination of these approaches."},
      {n:"9", t:"Test and refine computing technologies."},
      {n:"9.a", t:"Test, debug, and troubleshoot computing technologies systematically using appropriate methods, such as generating test cases for rule-based programs and accuracy evaluation for machine learning models."},
      {n:"9.b", t:"Iteratively refine and optimize technologies to meet criteria for success."}
    ]},
    INC: {desc:"One of four pillars of practices: productive collaborations with diverse groups of people, addressing communication skills, project management skills, and personal conduct when working with others.", subs:[
      {n:"3", t:"Communicate effectively about computing."},
      {n:"3.a", t:"Share technical ideas and explain computing concepts clearly to different audiences."},
      {n:"3.b", t:"Give and actively listen to others' input and constructive feedback. Consider diverse perspectives and multiple solutions to technical challenges."},
      {n:"4", t:"Manage computing projects."},
      {n:"4.a", t:"Establish shared goals, break the work into discrete tasks, and set development milestones."},
      {n:"4.b", t:"Document code and development processes."},
      {n:"5", t:"Act responsibly in computing collaborations."},
      {n:"5.a", t:"Cultivate working relationships with individuals possessing diverse perspectives, skills, and personalities."},
      {n:"5.b", t:"Participate reliably in computing teamwork, share responsibility for project outcomes, and meet development deadlines."},
      {n:"5.c", t:"Reflect on contributions to computing projects, including technical decisions and team interactions, to improve technical and collaboration skills."}
    ]},
    HCD: {desc:"One of four pillars of practices: responsibly developing computing technologies through human-centered design, drawing on principles of human-computer interaction to understand user needs and iteratively design systems that support and empower people.", subs:[
      {n:"10", t:"Understand and involve diverse users in design decisions."},
      {n:"10.a", t:"Learn about different people's experiences with computing technologies, including those with different abilities, backgrounds, and needs."},
      {n:"10.b", t:"Gather input and feedback from diverse users throughout the design and development process to help create positive user experiences."},
      {n:"11", t:"Use iterative design processes."},
      {n:"11.a", t:"Start with simple prototypes and continuously test and refine computing technologies to ensure usability and accessibility."},
      {n:"12", t:"Design computing technologies that empower and inform users."},
      {n:"12.a", t:"Respect users' autonomy. Be transparent about how computing technologies make decisions that affect users. Give users control over how they interact with technologies rather than leveraging human limitations to serve creators' interests over users' interests."},
      {n:"12.b", t:"Consider the benefits and harms of human-like behaviors in computing technologies (e.g., conversational AI) and how they influence user perceptions and actions."}
    ]},
    ETH: {desc:"One of four pillars of practices: habits that help students become responsible creators of technology, based on the ACM's general ethical principles.", subs:[
      {n:"1", t:"Use computing for positive social impact."},
      {n:"1.a", t:"Imagine and create computing technologies that solve problems, strengthen communities, and improve quality of life."},
      {n:"1.b", t:"Evaluate whether potential benefits of computing technologies outweigh possible harms. Ensure that harms are not concentrated on specific groups and avoid serious environmental harm."},
      {n:"1.c", t:"Explain design trade-offs in computing technologies, including the values these decisions reflect and what was prioritized or sacrificed."},
      {n:"2", t:"Respect others' rights and dignity when creating computing technologies."},
      {n:"2.a", t:"Respect other creators of computing technologies. Only use others' work with permission and give appropriate attribution."},
      {n:"2.b", t:"Respect users' privacy and protect their data. Give users choices about how their information is collected and used. Only collect the minimum amount of information necessary. Avoid practices that manipulate or undermine users."}
    ]},
    D1: {desc:"\"Creativity: Generating original and meaningful computing ideas and projects.\"" + DISP_NOTE, subs:[]},
    D2: {desc:"\"Sense of Belonging: Feeling included, respected, and recognized in the CS community.\"" + DISP_NOTE, subs:[]},
    D3: {desc:"\"Critical Thinking: Using reasoning and evidence to analyze and refine solutions.\"" + DISP_NOTE, subs:[]},
    D4: {desc:"\"Persistence: Continuing effort despite frustration or setbacks.\"" + DISP_NOTE, subs:[]},
    D5: {desc:"\"Reflectiveness: Connecting past experiences to inform future learning.\"" + DISP_NOTE, subs:[]},
    D6: {desc:"\"Resourcefulness: Seeking and using tools, people, and information to solve problems.\"" + DISP_NOTE, subs:[]},
    D7: {desc:"\"Curiosity: Asking questions and exploring beyond assigned work.\"" + DISP_NOTE, subs:[]},
    AD: {desc:"One of five concepts in the 2026 CSTA standards. An algorithm is a sequence of steps designed to accomplish a specific task; this concept covers designing and evaluating algorithms, including the shift from traditional rule-based algorithms toward data-driven ones like machine learning. Subconcepts, summarized from the standards:", subs:[
      {n:"Algorithmic Problem Solving", t:"Choosing the right data structure to pair with an algorithm, reworking an algorithm to run more clearly or efficiently, and giving AI-generated text, images, or code a critical look for accuracy, bias, or harm. HS-ALG-PS-01 to 05."},
      {n:"Machine Learning", t:"Defending the choice of one AI approach over another for a task, questioning a dataset before trusting it, and building a working model for a specific job. Sample standards: E5-ALG-ML-02 \"Train a machine learning model to make a classification or prediction\" (5th grade); HS-ALG-ML-06 to 08 (high school)."},
      {n:"Impacts of Algorithms &amp; Design", t:"Designing for genuinely broad usability, tracing unfairness in both rule-based and data-driven algorithms, and naming which values &mdash; efficiency, privacy, fairness &mdash; a design quietly prioritized. HS-ALG-IM-09 to 11."}
    ]},
    PR: {desc:"One of five concepts in the 2026 CSTA standards. Programming controls computing systems and lets people communicate with the world in new ways; students read, write, test, and refine code, increasingly alongside AI tools. Subconcepts, summarized from the standards:", subs:[
      {n:"Program Development", t:"Splitting a program into organized pieces, leaning on outside resources (docs, libraries, APIs) instead of reinventing everything, crediting borrowed work, and structuring teamwork with roles and a shared design document. HS-PRO-PD-12 to 15."},
      {n:"Variables &amp; Data Storage", t:"Choosing the right structure &mdash; a list, a dictionary &mdash; to hold a program's data. HS-PRO-VD-16."},
      {n:"Reading &amp; Documenting", t:"Explaining what someone else's code does, part by part (HS-PRO-RD-17), and giving AI-generated code the same scrutiny: testing it against what it was supposed to do, including edge cases (MS-PRO-RD-18, HS-PRO-RD-18)."},
      {n:"Testing &amp; Refining", t:"Checking a finished program against its own original plan, and actually acting on feedback and test results rather than filing them away. HS-PRO-TR-19 &amp; 20."}
    ]},
    DA3: {desc:"One of five concepts in the 2026 CSTA standards. Computers collect and store data so it can be analyzed to better understand the world and make predictions; a full Artificial Intelligence specialty strand builds on this concept for high school electives. Subconcepts, summarized from the standards:", subs:[
      {n:"Data Collection &amp; Preparation", t:"Manufacturing data to fit a simulation's needs, writing a data dictionary, cleaning up messy text data, and weighing different ways to validate a dataset's values. HS-DAT-DC-21 to 24."},
      {n:"Data Investigation", t:"Turning a multi-variable dataset into a chart to answer a question about it, and spotting how someone else's chart or simulation can still mislead. HS-DAT-DI-25 &amp; 26."},
      {n:"Impacts of Data Science", t:"Weighing the real costs of collecting data at scale &mdash; consent, ownership, bias, misinformation, even data centers' environmental footprint &mdash; and arguing both sides of whether a privacy law actually works. HS-DAT-IM-27 &amp; 28."}
    ]},
    SS: {desc:"One of five concepts in the 2026 CSTA standards, merging hardware, networks, and security into one strand to reflect how tightly they're now connected. A Cybersecurity specialty strand goes deeper for high school electives. Subconcepts, summarized from the standards:", subs:[
      {n:"Hardware &amp; Software", t:"What sets an operating system apart from ordinary software, and what a real device's limits (battery life, screen size) mean for putting it to work. HS-SYS-HW-29 &amp; 30."},
      {n:"Security", t:"Naming what a security measure costs as well as what it protects, sorting out who a given breach actually affects, and proposing concrete fixes for a described vulnerability. HS-SYS-SE-31 to 33."},
      {n:"Networks", t:"Reading a network diagram's physical and software layers together, and understanding the internet as a layered network of networks held together by protocols like TCP/IP. HS-SYS-NT-34 &amp; 35."},
      {n:"Impacts of Computing Systems", t:"Explaining why a computing law or policy exists, and tracing who bears the unevenly distributed costs of computing's physical footprint &mdash; energy, e-waste, supply chains. HS-SYS-IM-36 &amp; 37."}
    ]},
    CSoc: {desc:"One of five concepts in the 2026 CSTA standards. Computing shapes, and is shaped by, individuals, communities, and cultures around the world; students learn to critically and responsibly navigate these social implications. Subconcepts, summarized from the standards:", subs:[
      {n:"History of Computing", t:"Tracing how forces outside the technology itself &mdash; economics, culture, politics &mdash; pushed a technology's design or adoption, and explaining the reasoning behind a specific privacy or algorithmic-transparency rule. HS-SOC-HI-38 &amp; 39."},
      {n:"Emerging Technologies", t:"What a new technology does differently under the hood, who its benefits leave out, and backing a proposed real-world use with research that's honest about who it might help or harm. HS-SOC-ET-40 to 42."},
      {n:"Humans &amp; Computing", t:"The choices behind a system &mdash; whose data, whose tuning, whose decisions about use &mdash; and the open question of whether an AI system could ever be intelligent the way a person is. HS-SOC-HU-43 &amp; 44."},
      {n:"Career Exploration", t:"Looking at how real, varied computing professionals actually work, and weighing what a student has learned against their own interests. HS-SOC-CE-45 &amp; 46."}
    ]}
  };

  var CSTA3_COVERED = {
    "Machine Learning":"AI & big data",
    "Reading &amp; Documenting":"AI & big data",
    "Impacts of Data Science":"AI & big data",
    "Security":"Networks & cybersecurity",
    "Networks":"Networks & cybersecurity",
    "3.b":"Empathy & active listening",
    "4":"Leadership & social influence",
    "4.a":"Talent management",
    "5.b":"Leadership & social influence",
    "1.b":"Environmental stewardship",
    "10.a":"Empathy & active listening",
    "10.b":"Service orientation",
    "12.a":"Service orientation",
    "6.a":"AI & big data",
    "8.c":"AI & big data"
  };

  // BEGIN MATE AND OCEAN VIEWS (generated by learn.porttack.com/tools/build_skills_widget_data.py; edit the JSON there, not this block)
  // MATE's 18 skills (Evaluate-Compete). The employer-skill links are authored in learn.porttack.com/_standards/mate-wef-links.json.
  var MATE_ANCHORS = [
    {id:"EMP.1", disp:"Employability.1", head:"Employability.1: Communication", name:"Communication", cls:"human", unit:"skill"},
    {id:"EMP.2", disp:"Employability.2", head:"Employability.2: Creativity", name:"Creativity", cls:"human", unit:"skill"},
    {id:"EMP.3", disp:"Employability.3", head:"Employability.3: Entrepreneurship", name:"Entrepreneurship", cls:"human", unit:"skill"},
    {id:"EMP.4", disp:"Employability.4", head:"Employability.4: Autonomy", name:"Autonomy", cls:"human", unit:"skill"},
    {id:"EMP.5", disp:"Employability.5", head:"Employability.5: Ability to Deal with Obstacles", name:"Ability to Deal with Obstacles", cls:"human", unit:"skill"},
    {id:"EMP.6", disp:"Employability.6", head:"Employability.6: Intellectual Development", name:"Intellectual Development", cls:"human", unit:"skill"},
    {id:"EMP.7", disp:"Employability.7", head:"Employability.7: Critical Thinking and Problem Solving", name:"Critical Thinking and Problem Solving", cls:"human", unit:"skill"},
    {id:"EMP.8", disp:"Employability.8", head:"Employability.8: Project Knowledge and Skills", name:"Project Knowledge and Skills", cls:"human", unit:"skill"},
    {id:"EMP.9", disp:"Employability.9", head:"Employability.9: Teamwork/Collaboration", name:"Teamwork/Collaboration", cls:"human", unit:"skill"},
    {id:"ROV.1", disp:"ROV.1", head:"ROV.1: Vehicle Design, Buoyancy, Propulsion", name:"Vehicle Design, Buoyancy, Propulsion", cls:"tech", unit:"skill"},
    {id:"ROV.2", disp:"ROV.2", head:"ROV.2: Systems Design", name:"Systems Design", cls:"tech", unit:"skill"},
    {id:"ROV.3", disp:"ROV.3", head:"ROV.3: Structure", name:"Structure", cls:"tech", unit:"skill"},
    {id:"ROV.4", disp:"ROV.4", head:"ROV.4: Control/Electrical", name:"Control/Electrical", cls:"tech", unit:"skill"},
    {id:"ROV.5", disp:"ROV.5", head:"ROV.5: Sensors/Payload/Tools", name:"Sensors/Payload/Tools", cls:"tech", unit:"skill"},
    {id:"ROV.6", disp:"ROV.6", head:"ROV.6: Safety", name:"Safety", cls:"tech", unit:"skill"},
    {id:"ROV.7", disp:"ROV.7", head:"ROV.7: Project Management", name:"Project Management", cls:"tech", unit:"skill"},
    {id:"ROV.8", disp:"ROV.8", head:"ROV.8: Technical Presentation", name:"Technical Presentation", cls:"tech", unit:"skill"},
    {id:"ROV.9", disp:"ROV.9", head:"ROV.9: Technology and Society", name:"Technology and Society", cls:"tech", unit:"skill"}
  ];
  var MATE_LINKS = [
    {s:0, a:"EMP.7", w:"strong"},
    {s:0, a:"EMP.6", w:"partial"},
    {s:1, a:"EMP.5", w:"strong"},
    {s:1, a:"EMP.4", w:"partial"},
    {s:2, a:"ROV.7", w:"partial"},
    {s:2, a:"EMP.9", w:"partial"},
    {s:3, a:"EMP.2", w:"strong"},
    {s:4, a:"EMP.4", w:"partial"},
    {s:4, a:"EMP.6", w:"partial"},
    {s:5, a:"ROV.4", w:"strong"},
    {s:5, a:"ROV.2", w:"strong"},
    {s:5, a:"ROV.5", w:"strong"},
    {s:5, a:"ROV.1", w:"partial"},
    {s:5, a:"EMP.8", w:"partial"},
    {s:6, a:"EMP.9", w:"partial"},
    {s:6, a:"EMP.1", w:"partial"},
    {s:7, a:"EMP.6", w:"strong"},
    {s:7, a:"EMP.8", w:"partial"},
    {s:8, a:"ROV.7", w:"partial"},
    {s:8, a:"EMP.9", w:"partial"},
    {s:9, a:"EMP.3", w:"strong"},
    {s:9, a:"ROV.8", w:"partial"},
    {s:10, a:"ROV.5", w:"partial"},
    {s:11, a:"ROV.4", w:"partial"},
    {s:12, a:"ROV.9", w:"strong"}
  ];
  var MATE_DETAILS = {
    "EMP.1": {desc:"Explains the engineering process and the design to a broad audience, uses images, diagrams and data well, and writes clearly. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-EMP.1\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.9\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Data and graphs</a><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.3\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Explain it</a><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.4\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Reach the public</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (8)</summary><ul><li><b>AP CSP</b> 2.3 <i>(partial)</i> Turn raw data into information by finding patterns.</li><li><b>CSTA 2026</b> HS-DAT-DI-25 <i>(strong)</i> Turn data into a chart that answers a question.</li><li><b>California CS</b> 9-12.AP.22 <i>(strong)</i> Write design decisions down so others can follow them.</li><li><b>California CS</b> 9-12.DA.10 <i>(partial)</i> How data is visualized shapes what readers take from it.</li><li><b>CA CTE (ICT)</b> 2.5 <i>(strong)</i> Fit the message and medium to each audience.</li><li><b>Common Core ELA</b> SL.8.4 and SL.9-10.4 <i>(strong)</i> Present findings clearly, with evidence.</li><li><b>Common Core ELA</b> W.8.2 and W.9-10.2 <i>(strong)</i> Write clear informative texts that explain ideas.</li><li><b>Common Core ELA</b> SL.8.5 and SL.9-10.5 <i>(partial)</i> Use visuals and media to strengthen a presentation.</li></ul></details>", subs:[
        {n:"Employability.1a", t:"Explain the engineering process and the design to any audience<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.3\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Explain it</a><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.4\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Reach the public</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.1a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.1b", t:"Use images, diagrams and data to show a design or process<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.9\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Data and graphs</a><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.4\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Reach the public</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.1b\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.1c", t:"Write clearly and correctly<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.3\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Explain it</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.1c\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "EMP.2": {desc:"Looks at a problem from several angles, connects ideas and applies knowledge in new ways. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-EMP.2\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.2\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Compare designs</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.10\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Underwater tools</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (3)</summary><ul><li><b>NGSS 2013</b> HS-ETS1-3 <i>(strong)</i> Judge a design on priorities and trade-offs such as cost and safety.</li><li><b>NGSS 2013</b> MS-ETS1-2 <i>(strong)</i> Compare design options against criteria and limits.</li><li><b>NGSS 2013</b> MS-ETS1-4 <i>(partial)</i> Build a model or test, then improve the design from the data.</li></ul></details>", subs:[
        {n:"Employability.2a", t:"Come at a problem from different angles<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.2\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Compare designs</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.2a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.2b", t:"Connect several ideas or approaches<br><i>Built by doing the competition, not taught as a unit.</i> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.2b\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.2c", t:"Apply what you know in new ways<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.10\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Underwater tools</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.2c\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "EMP.3": {desc:"Builds a product or service that meets customer needs, understands operations and budgets, and manages a project. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-EMP.3\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.1\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Plan from RFP</a><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.2\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Manage project</a><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.5\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Be a founder</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (7)</summary><ul><li><b>CA CTE (ICT)</b> 11.3 <i>(strong)</i> Entrepreneurship and new ventures are real options.</li><li><b>CA CTE (ICT)</b> 11.4 <i>(partial)</i> Entrepreneurial practice applies in ICT.</li><li><b>CA CTE (ICT)</b> 7.4 <i>(partial)</i> Manage time so responsibilities get met.</li><li><b>CA CTE (ICT)</b> C2.4 <i>(partial)</i> Understand what the client needs before designing.</li><li><b>NGSS 2013</b> HS-ETS1-1 <i>(strong)</i> Turn a big real-world need into specific requirements.</li><li><b>NGSS 2013</b> MS-ETS1-1 <i>(strong)</i> State what a design must do and what limits it.</li><li><b>CASEL</b> SM.5 <i>(strong)</i> Use planning and organizational skills.</li></ul></details>", subs:[
        {n:"Employability.3a", t:"Make a product or service that meets a customer's need<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.1\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Plan from RFP</a><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.5\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Be a founder</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.3a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.3b", t:"Understand how a business runs and what it costs<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.5\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Be a founder</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.3b\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.3c", t:"Manage a project<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.2\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Manage project</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.3c\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "EMP.4": {desc:"Works independently, knows when to ask for help, takes criticism well, and tries again after failing. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-EMP.4\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.8\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Use AI honestly</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (2)</summary><ul><li><b>CSTA 2026</b> HS-ALG-PS-05 <i>(partial)</i> Check AI output for accuracy, bias and harm.</li><li><b>CSTA 2026</b> HS-PRO-RD-18 <i>(partial)</i> Test AI-written code against what it should do.</li></ul></details>", subs:[
        {n:"Employability.4a", t:"Work on your own and know when to ask for help<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.8\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Use AI honestly</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.4a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.4b", t:"Take criticism and use the feedback<br><i>Built by doing the competition, not taught as a unit.</i> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.4b\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.4c", t:"Take risks and try again after failing<br><i>Built by doing the competition, not taught as a unit.</i> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.4c\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "EMP.5": {desc:"Keeps going after setbacks, stays flexible and improvises a fix for a design or equipment problem. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-EMP.5\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.11\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Troubleshoot</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (2)</summary><ul><li><b>California CS</b> 9-12.CS.3 <i>(strong)</i> Troubleshoot complex problems by researching and testing.</li><li><b>CA CTE (ICT)</b> C5.6 <i>(strong)</i> Debugging is part of quality assurance.</li></ul></details>", subs:[
        {n:"Employability.5a", t:"Keep going through setbacks and surprises<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.11\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Troubleshoot</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.5a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.5b", t:"Stay flexible and willing to try again (the source repeats Autonomy here)<br><i>Built by doing the competition, not taught as a unit.</i> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.5b\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.5c", t:"Improvise a quick fix to a design or equipment problem<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.11\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Troubleshoot</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.5c\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "EMP.6": {desc:"Sees that problems are more complex than they first look, accepts that more than one design can be acceptable, and knows the limits of what they know. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-EMP.6\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.8\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Use AI honestly</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (2)</summary><ul><li><b>CSTA 2026</b> HS-ALG-PS-05 <i>(partial)</i> Check AI output for accuracy, bias and harm.</li><li><b>CSTA 2026</b> HS-PRO-RD-18 <i>(partial)</i> Test AI-written code against what it should do.</li></ul></details>", subs:[
        {n:"Employability.6a", t:"See that problems are more complicated than they look<br><i>Built by doing the competition, not taught as a unit.</i> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.6a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.6b", t:"Accept that more than one design can work<br><i>Built by doing the competition, not taught as a unit.</i> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.6b\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.6c", t:"Know the limits of what you know<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.8\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Use AI honestly</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.6c\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "EMP.7": {desc:"Stays open-minded but skeptical about solutions, looks for root causes and compares alternative designs or ways of operating. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-EMP.7\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.1\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Plan from RFP</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.2\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Compare designs</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.5\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Real-world tests</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.11\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Troubleshoot</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.6\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Weigh factors</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (12)</summary><ul><li><b>CSTA 2026</b> HS-SOC-ET-41 <i>(partial)</i> Weigh a new technology's benefits against its costs.</li><li><b>California CS</b> 9-12.CS.3 <i>(strong)</i> Troubleshoot complex problems by researching and testing.</li><li><b>California CS</b> 9-12.AP.20 <i>(partial)</i> Improve programs by repeated testing and fixing.</li><li><b>CA CTE (ICT)</b> C5.6 <i>(strong)</i> Debugging is part of quality assurance.</li><li><b>CA CTE (ICT)</b> C2.4 <i>(partial)</i> Understand what the client needs before designing.</li><li><b>NGSS 2013</b> HS-ETS1-1 <i>(strong)</i> Turn a big real-world need into specific requirements.</li><li><b>NGSS 2013</b> HS-ETS1-3 <i>(strong)</i> Judge a design on priorities and trade-offs such as cost and safety.</li><li><b>NGSS 2013</b> MS-ETS1-1 <i>(strong)</i> State what a design must do and what limits it.</li><li><b>NGSS 2013</b> MS-ETS1-2 <i>(strong)</i> Compare design options against criteria and limits.</li><li><b>NGSS 2013</b> MS-ETS1-4 <i>(partial)</i> Build a model or test, then improve the design from the data.</li><li><b>California EP&amp;Cs</b> V.A <i>(strong)</i> Many factors go into decisions about natural resources.</li><li><b>CASEL</b> RDM.4 <i>(partial)</i> Think through the consequences of actions.</li></ul></details>", subs:[
        {n:"Employability.7a", t:"Stay open-minded but skeptical about possible solutions<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.5\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Real-world tests</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.7a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.7b", t:"Find the root cause of a problem and the right fix<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.11\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Troubleshoot</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.7b\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.7c", t:"Evaluate alternative designs or ways of operating<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.1\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Plan from RFP</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.2\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Compare designs</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.6\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Weigh factors</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.7c\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "EMP.8": {desc:"Understands the engineering and science behind the vehicle and its operation, and has the skills to do the work. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-EMP.8\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.7\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Sense, calibrate</a><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.7\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Know the rules</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.1\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ocean observing</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.2\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ecosystems</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.3\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Climate, ocean</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.4\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ocean energy</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.5\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> People, heritage</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (13)</summary><ul><li><b>CSTA 2026</b> HS-DAT-DC-24 <i>(partial)</i> Check that data has the right type and range.</li><li><b>CA CTE (ICT)</b> 10.2 <i>(strong)</i> Technical fields have rules and expectations to follow.</li><li><b>CA CTE (ICT)</b> 10.1 <i>(partial)</i> Use the field's own terms and symbols.</li><li><b>NGSS 2013</b> HS-ESS2-6 <i>(partial)</i> Model how carbon cycles through ocean, air, rock and life.</li><li><b>NGSS 2013</b> HS-ESS3-2 <i>(partial)</i> Compare energy and mineral resource designs by costs and benefits.</li><li><b>NGSS 2013</b> HS-LS2-7 <i>(partial)</i> Design and improve a way to reduce human harm to ecosystems.</li><li><b>NGSS 2013</b> MS-ESS3-3 <i>(partial)</i> Design a way to monitor and reduce a human impact.</li><li><b>NGSS 2013</b> MS-LS2-5 <i>(partial)</i> Weigh designs that protect biodiversity and ecosystem services.</li><li><b>California EP&amp;Cs</b> III.C <i>(strong)</i> Human practices can change natural cycles.</li><li><b>California EP&amp;Cs</b> I.B <i>(partial)</i> Ecosystem services, like clean water, are essential to people.</li><li><b>California EP&amp;Cs</b> II.B <i>(partial)</i> How resources are harvested and used shapes natural systems.</li><li><b>California EP&amp;Cs</b> IV.B <i>(partial)</i> By-products enter natural systems and are hard to contain.</li><li><b>California EP&amp;Cs</b> V.A <i>(partial)</i> Many factors go into decisions about natural resources.</li></ul></details>", subs:[
        {n:"Employability.8a", t:"Understand the engineering and science behind the vehicle and how it runs<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.7\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Sense, calibrate</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.1\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ocean observing</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.2\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ecosystems</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.3\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Climate, ocean</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.4\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ocean energy</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.5\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> People, heritage</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.8a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.8b", t:"Have the skills to design and run the vehicle<br><i>Built by doing the competition, not taught as a unit.</i> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.8b\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.8c", t:"Master the skills it takes to compete well<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.7\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Know the rules</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.8c\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "EMP.9": {desc:"Treats others with respect, works well in a team and shares knowledge within and across teams. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-EMP.9\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.1\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Run the team</a><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.9\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Give back</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (5)</summary><ul><li><b>CSTA 2026</b> HS-PRO-PD-15 <i>(strong)</i> Team programming needs roles, a design document and tracking.</li><li><b>California CS</b> 9-12.AP.21 <i>(strong)</i> Team projects need defined roles and shared tools.</li><li><b>CA CTE (ICT)</b> 9.3 <i>(strong)</i> Teamwork, leadership and citizenship in school and community.</li><li><b>CASEL</b> REL.4 <i>(strong)</i> Practice teamwork and collaboration.</li><li><b>CASEL</b> RDM.6 <i>(partial)</i> Reflect on your role in your community's well-being.</li></ul></details>", subs:[
        {n:"Employability.9a", t:"Be collegial and treat others with respect<br><i>Built by doing the competition, not taught as a unit.</i> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.9a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.9b", t:"Work effectively in a team<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.1\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Run the team</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.9b\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"Employability.9c", t:"Share knowledge in your team and with other teams<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.9\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Give back</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-EMP.9c\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "ROV.1": {desc:"Applies buoyancy and ballast principles, the properties of water and the physics of propulsion to the vehicle's design. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-ROV.1\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.4\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Build reliably</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.5\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Real-world tests</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.8\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Run on its own</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.12\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Trim and thrust</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (6)</summary><ul><li><b>AP CSP</b> 3.6 <i>(partial)</i> Choose between paths with an if statement.</li><li><b>California CS</b> 9-12.AP.20 <i>(partial)</i> Improve programs by repeated testing and fixing.</li><li><b>CA CTE (ICT)</b> 7.5 <i>(strong)</i> Quality counts in how work is built and presented.</li><li><b>CA CTE (ICT)</b> C9.2 <i>(partial)</i> Assemble hardware with the right tools and testing.</li><li><b>CA CTE (ICT)</b> C9.5 <i>(partial)</i> Program a microcontroller to run a device or robot.</li><li><b>NGSS 2013</b> MS-ETS1-4 <i>(partial)</i> Build a model or test, then improve the design from the data.</li></ul></details>", subs:[
        {n:"ROV.1a", t:"Apply buoyancy and ballast to the vehicle's design<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.8\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Run on its own</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.12\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Trim and thrust</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.1a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"ROV.1b", t:"Apply the properties of water, such as pressure rising with depth<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.4\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Build reliably</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.5\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Real-world tests</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.12\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Trim and thrust</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.1b\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"ROV.1c", t:"Apply hydrodynamics and Newton's laws to propulsion<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.12\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Trim and thrust</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.1c\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "ROV.2": {desc:"Understands the engineering principles behind the vehicle's systems and applies them to designing those systems. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-ROV.2\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.4\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Build reliably</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.6\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Drive, control</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (4)</summary><ul><li><b>CA CTE (ICT)</b> 7.5 <i>(strong)</i> Quality counts in how work is built and presented.</li><li><b>CA CTE (ICT)</b> C9.2 <i>(partial)</i> Assemble hardware with the right tools and testing.</li><li><b>CA CTE (ICT)</b> C9.3 <i>(partial)</i> Hardware takes input, processes it and acts.</li><li><b>CA CTE (ICT)</b> C9.5 <i>(partial)</i> Program a microcontroller to run a device or robot.</li></ul></details>", subs:[
        {n:"ROV.2a", t:"Apply engineering principles to designing the vehicle's systems<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.4\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Build reliably</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.6\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Drive, control</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.2a\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "ROV.3": {desc:"Can explain the trade-offs and reasoning behind the vehicle's cost, size and weight. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-ROV.3\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.2\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Compare designs</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.12\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Trim and thrust</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (3)</summary><ul><li><b>NGSS 2013</b> HS-ETS1-3 <i>(strong)</i> Judge a design on priorities and trade-offs such as cost and safety.</li><li><b>NGSS 2013</b> MS-ETS1-2 <i>(strong)</i> Compare design options against criteria and limits.</li><li><b>NGSS 2013</b> MS-ETS1-4 <i>(partial)</i> Build a model or test, then improve the design from the data.</li></ul></details>", subs:[
        {n:"ROV.3a", t:"Explain the trade-offs behind cost, size and weight<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.2\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Compare designs</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.12\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Trim and thrust</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.3a\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "ROV.4": {desc:"Applies electrical concepts to the control and electrical systems and integrates software and electronics into vehicle control. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-ROV.4\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.3\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Power budget</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.6\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Drive, control</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.8\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Run on its own</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (4)</summary><ul><li><b>AP CSP</b> 3.6 <i>(partial)</i> Choose between paths with an if statement.</li><li><b>CA CTE (ICT)</b> C9.3 <i>(partial)</i> Hardware takes input, processes it and acts.</li><li><b>CA CTE (ICT)</b> C9.5 <i>(partial)</i> Program a microcontroller to run a device or robot.</li><li><b>NGSS 2013</b> MS-ETS1-1 <i>(partial)</i> State what a design must do and what limits it.</li></ul></details>", subs:[
        {n:"ROV.4a", t:"Apply electrical concepts to the control and power system<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.3\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Power budget</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.4a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"ROV.4b", t:"Integrate software and electronics into vehicle control<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.6\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Drive, control</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.8\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Run on its own</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.4b\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "ROV.5": {desc:"Can identify and evaluate sensors and tooling, cameras included, against the mission's needs, and applies programming to control and sensing. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-ROV.5\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.6\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Drive, control</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.7\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Sense, calibrate</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.8\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Run on its own</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.9\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Data and graphs</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.10\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Underwater tools</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (8)</summary><ul><li><b>AP CSP</b> 2.3 <i>(partial)</i> Turn raw data into information by finding patterns.</li><li><b>AP CSP</b> 3.6 <i>(partial)</i> Choose between paths with an if statement.</li><li><b>CSTA 2026</b> HS-DAT-DI-25 <i>(strong)</i> Turn data into a chart that answers a question.</li><li><b>CSTA 2026</b> HS-DAT-DC-24 <i>(partial)</i> Check that data has the right type and range.</li><li><b>California CS</b> 9-12.DA.10 <i>(partial)</i> How data is visualized shapes what readers take from it.</li><li><b>CA CTE (ICT)</b> C9.3 <i>(partial)</i> Hardware takes input, processes it and acts.</li><li><b>CA CTE (ICT)</b> C9.5 <i>(partial)</i> Program a microcontroller to run a device or robot.</li><li><b>NGSS 2013</b> MS-ETS1-4 <i>(partial)</i> Build a model or test, then improve the design from the data.</li></ul></details>", subs:[
        {n:"ROV.5a", t:"Choose and evaluate sensors, tools and cameras for the mission<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.6\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Drive, control</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.7\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Sense, calibrate</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.10\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Underwater tools</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.5a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"ROV.5b", t:"Program the control and sensing<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.8\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Run on its own</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.9\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Data and graphs</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.5b\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "ROV.6": {desc:"Understands safety principles and applies them to people, equipment and operations. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-ROV.6\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.3\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Power budget</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.4\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Build reliably</a><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.6\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Work safely</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (5)</summary><ul><li><b>CA CTE (ICT)</b> 6.6 <i>(strong)</i> A safe workplace must be actively maintained.</li><li><b>CA CTE (ICT)</b> 7.5 <i>(strong)</i> Quality counts in how work is built and presented.</li><li><b>CA CTE (ICT)</b> 6.2 <i>(partial)</i> Workplace rules state what employers and workers owe.</li><li><b>CA CTE (ICT)</b> C9.2 <i>(partial)</i> Assemble hardware with the right tools and testing.</li><li><b>NGSS 2013</b> MS-ETS1-1 <i>(partial)</i> State what a design must do and what limits it.</li></ul></details>", subs:[
        {n:"ROV.6a", t:"Apply safety principles to people, equipment and operations<br><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.3\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Power budget</a><a class=\"wsw-comp\" data-area=\"ENG\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-ENG.4\" target=\"_blank\" rel=\"noopener\"><b>Engineering:</b> Build reliably</a><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.6\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Work safely</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.6a\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "ROV.7": {desc:"Organizes the team as a company with defined roles, plans the deliverables, tracks a budget, and manages tasks and time. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-ROV.7\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.1\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Run the team</a><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.2\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Manage project</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (5)</summary><ul><li><b>CSTA 2026</b> HS-PRO-PD-15 <i>(strong)</i> Team programming needs roles, a design document and tracking.</li><li><b>California CS</b> 9-12.AP.21 <i>(strong)</i> Team projects need defined roles and shared tools.</li><li><b>CA CTE (ICT)</b> 7.4 <i>(partial)</i> Manage time so responsibilities get met.</li><li><b>CASEL</b> REL.4 <i>(strong)</i> Practice teamwork and collaboration.</li><li><b>CASEL</b> SM.5 <i>(strong)</i> Use planning and organizational skills.</li></ul></details>", subs:[
        {n:"ROV.7a", t:"Organize as a company with a role for everyone<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.1\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Run the team</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.7a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"ROV.7b", t:"Plan and stay on task through every deliverable<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.2\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Manage project</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.7b\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"ROV.7c", t:"Create and track a budget<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.2\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Manage project</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.7c\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"ROV.7d", t:"Manage tasks and time<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.2\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Manage project</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.7d\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "ROV.8": {desc:"Produces detailed documentation, presents it to support the design, builds a display that explains the design, and can explain its strengths and weaknesses. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-ROV.8\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.3\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Explain it</a><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.4\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Reach the public</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (5)</summary><ul><li><b>California CS</b> 9-12.AP.22 <i>(strong)</i> Write design decisions down so others can follow them.</li><li><b>CA CTE (ICT)</b> 2.5 <i>(strong)</i> Fit the message and medium to each audience.</li><li><b>Common Core ELA</b> SL.8.4 and SL.9-10.4 <i>(strong)</i> Present findings clearly, with evidence.</li><li><b>Common Core ELA</b> W.8.2 and W.9-10.2 <i>(strong)</i> Write clear informative texts that explain ideas.</li><li><b>Common Core ELA</b> SL.8.5 and SL.9-10.5 <i>(partial)</i> Use visuals and media to strengthen a presentation.</li></ul></details>", subs:[
        {n:"ROV.8a", t:"Write detailed documentation<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.3\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Explain it</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.8a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"ROV.8b", t:"Present the documentation to support the design<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.3\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Explain it</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.8b\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"ROV.8c", t:"Make a marketing display that explains the design<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.4\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Reach the public</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.8c\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"ROV.8d", t:"Explain the design's strengths and weaknesses<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.3\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Explain it</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.8d\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]},
    "ROV.9": {desc:"Connects the theme and mission tasks to real-world problems and is aware of environmental, social and governance factors in business decisions. <a href=\"https://learn.porttack.com/standards/mate/rollup/#skill-ROV.9\" target=\"_blank\" rel=\"noopener\">Full entry: standards, lessons</a>", comps:"<b>Competencies that build it:</b><br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.5\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Be a founder</a><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.9\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Give back</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.1\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ocean observing</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.2\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ecosystems</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.3\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Climate, ocean</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.4\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ocean energy</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.5\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> People, heritage</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.6\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Weigh factors</a>", more:"<details class=\"wsw-stds\"><summary>Standards these competencies draw on (16)</summary><ul><li><b>CSTA 2026</b> HS-SOC-ET-41 <i>(partial)</i> Weigh a new technology's benefits against its costs.</li><li><b>CA CTE (ICT)</b> 11.3 <i>(strong)</i> Entrepreneurship and new ventures are real options.</li><li><b>CA CTE (ICT)</b> 9.3 <i>(strong)</i> Teamwork, leadership and citizenship in school and community.</li><li><b>CA CTE (ICT)</b> 11.4 <i>(partial)</i> Entrepreneurial practice applies in ICT.</li><li><b>NGSS 2013</b> HS-ESS2-6 <i>(partial)</i> Model how carbon cycles through ocean, air, rock and life.</li><li><b>NGSS 2013</b> HS-ESS3-2 <i>(partial)</i> Compare energy and mineral resource designs by costs and benefits.</li><li><b>NGSS 2013</b> HS-LS2-7 <i>(partial)</i> Design and improve a way to reduce human harm to ecosystems.</li><li><b>NGSS 2013</b> MS-ESS3-3 <i>(partial)</i> Design a way to monitor and reduce a human impact.</li><li><b>NGSS 2013</b> MS-LS2-5 <i>(partial)</i> Weigh designs that protect biodiversity and ecosystem services.</li><li><b>California EP&amp;Cs</b> III.C <i>(strong)</i> Human practices can change natural cycles.</li><li><b>California EP&amp;Cs</b> V.A <i>(strong)</i> Many factors go into decisions about natural resources.</li><li><b>California EP&amp;Cs</b> I.B <i>(partial)</i> Ecosystem services, like clean water, are essential to people.</li><li><b>California EP&amp;Cs</b> II.B <i>(partial)</i> How resources are harvested and used shapes natural systems.</li><li><b>California EP&amp;Cs</b> IV.B <i>(partial)</i> By-products enter natural systems and are hard to contain.</li><li><b>CASEL</b> RDM.4 <i>(partial)</i> Think through the consequences of actions.</li><li><b>CASEL</b> RDM.6 <i>(partial)</i> Reflect on your role in your community's well-being.</li></ul></details>", subs:[
        {n:"ROV.9a", t:"Relate the competition theme to real-world issues<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.9\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Give back</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.1\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ocean observing</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.2\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ecosystems</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.3\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Climate, ocean</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.4\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ocean energy</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.5\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> People, heritage</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.9a\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"ROV.9b", t:"Relate the mission tasks to real technical problems<br><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.1\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ocean observing</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.2\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ecosystems</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.3\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Climate, ocean</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.4\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Ocean energy</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.5\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> People, heritage</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.9b\" target=\"_blank\" rel=\"noopener\">more</a>"},
        {n:"ROV.9c", t:"Know how organizations weigh environmental, social and governance factors<br><a class=\"wsw-comp\" data-area=\"PRO\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-PRO.5\" target=\"_blank\" rel=\"noopener\"><b>Professional:</b> Be a founder</a><a class=\"wsw-comp\" data-area=\"UND\" href=\"https://learn.porttack.com/standards/mate/competencies/#T-UND.6\" target=\"_blank\" rel=\"noopener\"><b>Environmental:</b> Weigh factors</a> <a href=\"https://learn.porttack.com/standards/mate/rollup/#sub-ROV.9c\" target=\"_blank\" rel=\"noopener\">more</a>"}
    ]}
  };
  // The Ocean Decade's ten challenges (oceandecade.org), as a left list, as right-hand anchors and as bars.
  var OCEAN_LEFT = [
    {name:"1. Understand and beat marine pollution", cls:"ocean"},
    {name:"2. Protect and restore ecosystems and biodiversity", cls:"ocean"},
    {name:"3. Sustainably nourish the global population", cls:"ocean"},
    {name:"4. Develop a sustainable, resilient and equitable ocean economy", cls:"ocean"},
    {name:"5. Unlock ocean-based solutions to climate change", cls:"ocean"},
    {name:"6. Increase community resilience to ocean and coastal risks", cls:"ocean"},
    {name:"7. Sustainably expand the Global Ocean Observing System", cls:"ocean"},
    {name:"8. Create a digital representation of the ocean", cls:"ocean"},
    {name:"9. Skills, knowledge, technology and participation for all", cls:"ocean"},
    {name:"10. Restore society's relationship with the ocean", cls:"ocean"}
  ];
  var OCEAN_ANCHORS = [
    {id:"OD.1", disp:"1", name:"Understand and beat marine pollution", cls:"ocean", unit:"challenge"},
    {id:"OD.2", disp:"2", name:"Protect and restore ecosystems and biodiversity", cls:"ocean", unit:"challenge"},
    {id:"OD.3", disp:"3", name:"Sustainably nourish the global population", cls:"ocean", unit:"challenge"},
    {id:"OD.4", disp:"4", name:"Develop a sustainable, resilient and equitable ocean economy", cls:"ocean", unit:"challenge"},
    {id:"OD.5", disp:"5", name:"Unlock ocean-based solutions to climate change", cls:"ocean", unit:"challenge"},
    {id:"OD.6", disp:"6", name:"Increase community resilience to ocean and coastal risks", cls:"ocean", unit:"challenge"},
    {id:"OD.7", disp:"7", name:"Sustainably expand the Global Ocean Observing System", cls:"ocean", unit:"challenge"},
    {id:"OD.8", disp:"8", name:"Create a digital representation of the ocean", cls:"ocean", unit:"challenge"},
    {id:"OD.9", disp:"9", name:"Skills, knowledge, technology and participation for all", cls:"ocean", unit:"challenge"},
    {id:"OD.10", disp:"10", name:"Restore society's relationship with the ocean", cls:"ocean", unit:"challenge"}
  ];
  var OCEAN_DETAILS = {
    "OD.1": {desc:"Find and map where pollution on land and at sea comes from, learn what it does to people and ocean life, and develop ways to remove it or reduce it. MATE did not tag it on any mission task in the manuals read.", subs:[
        
    ]},
    "OD.2": {desc:"Understand how several pressures at once affect ocean ecosystems, and develop ways to monitor, protect, manage and restore ecosystems and their biodiversity as conditions change. MATE tags it on these mission tasks:", subs:[
        {n:"2024-3", t:"From the Red Sea to Tennessee"},
        {n:"2025-1", t:"Shipwrecks, Spotter Buoys, and Flying Fish"},
        {n:"2025-2", t:"Marine Renewable Energy"},
        {n:"2026-1", t:"Seabed 2030, A Kaleidoscope of Corals in Cold Water"},
        {n:"2026-2", t:"SmartAtlantic Alliance"}
    ]},
    "OD.3": {desc:"Build knowledge and solutions so the ocean can feed the world's growing population in a sustainable way as conditions change. MATE did not tag it on any mission task in the manuals read.", subs:[
        
    ]},
    "OD.4": {desc:"Build knowledge, innovation and partnerships for an ocean economy that is fair, resilient and sustainable as conditions change. MATE tags it on these mission tasks:", subs:[
        {n:"2025-2", t:"Marine Renewable Energy"},
        {n:"2026-3", t:"Wind-Powered Offshore Oil Platform"}
    ]},
    "OD.5": {desc:"Understand the link between ocean and climate, and develop knowledge and solutions to reduce climate change, adapt to it and build resilience, everywhere. MATE tags it on these mission tasks:", subs:[
        {n:"2024-4", t:"MATE Floats"},
        {n:"2025-3", t:"MATE Floats"},
        {n:"2026-3", t:"Wind-Powered Offshore Oil Platform"},
        {n:"2026-4", t:"MATE Floats Under the Ice"}
    ]},
    "OD.6": {desc:"Improve early warning for every kind of ocean and coastal hazard, and prepare communities to withstand them. MATE tags it on these mission tasks:", subs:[
        {n:"2026-3", t:"Wind-Powered Offshore Oil Platform"}
    ]},
    "OD.7": {desc:"Keep a lasting ocean observing system working across all ocean basins that delivers accessible, timely and useful data to everyone who needs it. MATE tags it on these mission tasks:", subs:[
        {n:"2024-1", t:"OOI Coastal Pioneer Array"},
        {n:"2024-2", t:"SMART Cables for Ocean Observing"},
        {n:"2025-1", t:"Shipwrecks, Spotter Buoys, and Flying Fish"},
        {n:"2025-3", t:"MATE Floats"},
        {n:"2026-2", t:"SmartAtlantic Alliance"},
        {n:"2026-3", t:"Wind-Powered Offshore Oil Platform"},
        {n:"2026-4", t:"MATE Floats Under the Ice"}
    ]},
    "OD.8": {desc:"Work across groups to build a complete, open digital picture of the ocean, including a dynamic ocean map, for exploring past, present and future conditions. MATE tags it on these mission tasks:", subs:[
        {n:"2025-1", t:"Shipwrecks, Spotter Buoys, and Flying Fish"},
        {n:"2025-3", t:"MATE Floats"},
        {n:"2026-1", t:"Seabed 2030, A Kaleidoscope of Corals in Cold Water"},
        {n:"2026-4", t:"MATE Floats Under the Ice"}
    ]},
    "OD.9": {desc:"Build skills and share knowledge, data and technology fairly, so everyone involved in ocean science can take part. MATE did not tag it on any mission task in the manuals read.", subs:[
        
    ]},
    "OD.10": {desc:"Strengthen people's connection to the ocean so that people in every sector have the motivation, ability and opportunity to decide and act in ways that keep the ocean healthy. MATE did not tag it on any mission task in the manuals read.", subs:[
        
    ]}
  };
  // Equal-length bars: the challenges are not ranked. The value is how many of MATE's mission tasks (2024 to 2026) tag the challenge (a plain number; the caption says what it counts).
  var OCEAN_BARS = [
    {name:"Understand and beat marine pollution", cls:"ocean", w:100, valText:"0"},
    {name:"Protect and restore ecosystems and biodiversity", cls:"ocean", w:100, valText:"5"},
    {name:"Sustainably nourish the global population", cls:"ocean", w:100, valText:"0"},
    {name:"Develop a sustainable, resilient and equitable ocean economy", cls:"ocean", w:100, valText:"2"},
    {name:"Unlock ocean-based solutions to climate change", cls:"ocean", w:100, valText:"4"},
    {name:"Increase community resilience to ocean and coastal risks", cls:"ocean", w:100, valText:"1"},
    {name:"Sustainably expand the Global Ocean Observing System", cls:"ocean", w:100, valText:"7"},
    {name:"Create a digital representation of the ocean", cls:"ocean", w:100, valText:"4"},
    {name:"Skills, knowledge, technology and participation for all", cls:"ocean", w:100, valText:"0"},
    {name:"Restore society's relationship with the ocean", cls:"ocean", w:100, valText:"0"}
  ];
  var CTE_CLS = CTE.map(function (d) { return d.cls; });
  var WEF30_ANCHORS = [
    {id:"w10", disp:"1", name:"AI & big data", cls:CTE_CLS[10], unit:"skill"},
    {id:"w11", disp:"2", name:"Networks & cybersecurity", cls:CTE_CLS[11], unit:"skill"},
    {id:"w5", disp:"3", name:"Technological literacy", cls:CTE_CLS[5], unit:"skill"},
    {id:"w3", disp:"4", name:"Creative thinking", cls:CTE_CLS[3], unit:"skill"},
    {id:"w1", disp:"5", name:"Resilience, flexibility & agility", cls:CTE_CLS[1], unit:"skill"},
    {id:"w7", disp:"6", name:"Curiosity & lifelong learning", cls:CTE_CLS[7], unit:"skill"},
    {id:"w2", disp:"7", name:"Leadership & social influence", cls:CTE_CLS[2], unit:"skill"},
    {id:"w8", disp:"8", name:"Talent management", cls:CTE_CLS[8], unit:"skill"},
    {id:"w0", disp:"9", name:"Analytical thinking", cls:CTE_CLS[0], unit:"skill"},
    {id:"w12", disp:"10", name:"Environmental stewardship", cls:CTE_CLS[12], unit:"skill"}
  ];
  var WEF30_DETAILS = {
    "w10": {desc:"Ranked 1 of ten skills growing fastest to 2030. Not on the 2025 most essential list.", subs:[]},
    "w11": {desc:"Ranked 2 of ten skills growing fastest to 2030. Not on the 2025 most essential list.", subs:[]},
    "w5": {desc:"Ranked 3 of ten skills growing fastest to 2030. Ranked 6 of ten most essential in 2025.", subs:[]},
    "w3": {desc:"Ranked 4 of ten skills growing fastest to 2030. Ranked 4 of ten most essential in 2025.", subs:[]},
    "w1": {desc:"Ranked 5 of ten skills growing fastest to 2030. Ranked 2 of ten most essential in 2025.", subs:[]},
    "w7": {desc:"Ranked 6 of ten skills growing fastest to 2030. Ranked 8 of ten most essential in 2025.", subs:[]},
    "w2": {desc:"Ranked 7 of ten skills growing fastest to 2030. Ranked 3 of ten most essential in 2025.", subs:[]},
    "w8": {desc:"Ranked 8 of ten skills growing fastest to 2030. Ranked 9 of ten most essential in 2025.", subs:[]},
    "w0": {desc:"Ranked 9 of ten skills growing fastest to 2030. Ranked 1 of ten most essential in 2025.", subs:[]},
    "w12": {desc:"Ranked 10 of ten skills growing fastest to 2030. Not on the 2025 most essential list.", subs:[]}
  };
  var WEF25_IDX = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  var WEF30_IDX = [10, 11, 5, 3, 1, 7, 2, 8, 0, 12];
  function pick(idxs) { return idxs.map(function (i) { return {name: CTE[i].name, cls: CTE[i].cls}; }); }
  function remap(links, idxs) {
    var out = [];
    links.forEach(function (l) { var p = idxs.indexOf(l.s); if (p !== -1) out.push({s: p, a: l.a, w: l.w}); });
    return out;
  }
  var WEF30_OCEAN_LINKS = [
    {s:0, a:"OD.2", w:"partial"},
    {s:0, a:"OD.1", w:"partial"},
    {s:0, a:"OD.5", w:"partial"},
    {s:1, a:"OD.6", w:"strong"},
    {s:1, a:"OD.5", w:"partial"},
    {s:1, a:"OD.4", w:"partial"},
    {s:2, a:"OD.10", w:"partial"},
    {s:2, a:"OD.4", w:"partial"},
    {s:3, a:"OD.4", w:"partial"},
    {s:3, a:"OD.3", w:"partial"},
    {s:5, a:"OD.9", w:"strong"},
    {s:5, a:"OD.8", w:"partial"},
    {s:7, a:"OD.9", w:"strong"},
    {s:7, a:"OD.10", w:"partial"},
    {s:8, a:"OD.9", w:"partial"},
    {s:10, a:"OD.8", w:"strong"},
    {s:10, a:"OD.7", w:"partial"},
    {s:11, a:"OD.7", w:"partial"},
    {s:11, a:"OD.8", w:"partial"},
    {s:12, a:"OD.2", w:"strong"},
    {s:12, a:"OD.1", w:"strong"},
    {s:12, a:"OD.10", w:"strong"},
    {s:12, a:"OD.5", w:"partial"}
  ]; // s = index in CTE
  var OCEAN_MATE_LINKS = [
    {s:0, a:"ROV.9", w:"partial"},
    {s:0, a:"ROV.5", w:"partial"},
    {s:1, a:"ROV.9", w:"strong"},
    {s:1, a:"EMP.8", w:"strong"},
    {s:2, a:"ROV.9", w:"partial"},
    {s:3, a:"ROV.9", w:"strong"},
    {s:3, a:"EMP.8", w:"strong"},
    {s:3, a:"EMP.3", w:"partial"},
    {s:4, a:"ROV.9", w:"strong"},
    {s:4, a:"EMP.8", w:"strong"},
    {s:4, a:"ROV.1", w:"strong"},
    {s:4, a:"ROV.4", w:"strong"},
    {s:4, a:"ROV.5", w:"strong"},
    {s:5, a:"ROV.9", w:"strong"},
    {s:5, a:"EMP.8", w:"strong"},
    {s:5, a:"ROV.6", w:"partial"},
    {s:6, a:"ROV.9", w:"strong"},
    {s:6, a:"EMP.8", w:"strong"},
    {s:6, a:"ROV.1", w:"strong"},
    {s:6, a:"ROV.4", w:"strong"},
    {s:6, a:"ROV.5", w:"strong"},
    {s:7, a:"ROV.9", w:"strong"},
    {s:7, a:"EMP.8", w:"strong"},
    {s:7, a:"ROV.1", w:"strong"},
    {s:7, a:"ROV.4", w:"strong"},
    {s:7, a:"ROV.5", w:"strong"},
    {s:8, a:"EMP.8", w:"partial"},
    {s:8, a:"EMP.9", w:"partial"},
    {s:8, a:"EMP.1", w:"partial"},
    {s:9, a:"ROV.9", w:"partial"},
    {s:9, a:"EMP.1", w:"partial"},
    {s:9, a:"ROV.8", w:"partial"}
  ]; // s = index in OCEAN_LEFT
  var MATE_OCEAN = {
    matchViews: {
      mate25: {left: pick(WEF25_IDX), leftTitle: "WEF skills, 2025 most essential", leftNoun: "employer skills", anchors: MATE_ANCHORS, links: remap(MATE_LINKS, WEF25_IDX), details: MATE_DETAILS, covered: {}, rightTitle: "MATE ROV skills", hint: "Hover or tap a skill on the left to light up its matches, or an item on the right to read its full text."},
      mate30: {left: pick(WEF30_IDX), leftTitle: "WEF skills, growing fastest to 2030", leftNoun: "employer skills", anchors: MATE_ANCHORS, links: remap(MATE_LINKS, WEF30_IDX), details: MATE_DETAILS, covered: {}, rightTitle: "MATE ROV skills", hint: "Hover or tap a skill on the left to light up its matches, or an item on the right to read its full text."},
      "ocean-mate": {left: OCEAN_LEFT, leftTitle: "Ocean Decade challenges", leftNoun: "Ocean Decade challenges", anchors: MATE_ANCHORS, links: OCEAN_MATE_LINKS, details: MATE_DETAILS, covered: {}, rightTitle: "MATE ROV skills", hint: "Hover or tap a challenge on the left to light up its matches, or an item on the right to read its full text."},
      "wef30-ocean": {left: pick(WEF30_IDX), leftTitle: "WEF skills, growing fastest to 2030", leftNoun: "employer skills", anchors: OCEAN_ANCHORS, links: remap(WEF30_OCEAN_LINKS, WEF30_IDX), details: OCEAN_DETAILS, covered: {}, rightTitle: "Ocean Decade challenges", hint: "Hover or tap a skill on the left to light up its matches, or an item on the right to read its full text."},
      "ocean-wef30": {left: OCEAN_LEFT, leftTitle: "Ocean Decade challenges", leftNoun: "Ocean Decade challenges", anchors: WEF30_ANCHORS, links: [], details: WEF30_DETAILS, covered: {}, rightTitle: "WEF skills, growing fastest to 2030", hint: "Hover or tap a challenge on the left to light up its matches, or an item on the right to read its full text."}
    },
    bars: {ocean: OCEAN_BARS},
    captions: {}
  };
  // The same links read from the other side: challenge on the left, 2030 skill (anchor "w<index>") on the right.
  MATE_OCEAN.matchViews["ocean-wef30"].links = WEF30_OCEAN_LINKS.map(function (l) { return {s: parseInt(l.a.slice(3), 10) - 1, a: "w" + l.s, w: l.w}; });
  MATE_OCEAN.captions = {
      "mate25": "<b>The ten skills employers called most essential in 2025, against MATE's eighteen.</b> Solid lines are direct matches, dashed lines partial ones. Structure, Safety and Technology and Society match none of these ten.",
      "mate30": "<b>The ten skills growing fastest to 2030, against MATE's eighteen.</b> Solid lines are direct matches, dashed lines partial ones. Communication, Entrepreneurship, Structure, Safety and Technical Presentation match none of these ten. Empathy and service orientation were on the 2025 list but are not on the 2030 one, which is why Communication, Entrepreneurship and Technical Presentation lose their lines.",
      "ocean": "<b>The ten Ocean Decade challenges.</b> The bars are all the same length because the challenges are not ranked. The number on the right is how many of MATE's mission tasks from 2024 to 2026 tag each one. MATE tagged no task with challenges 1, 3, 9 and 10.",
      "ocean-mate": "<b>The ten Ocean Decade challenges, against MATE's eighteen skills.</b> MATE tags mission tasks, not skills, so a solid line follows MATE's own tags through the competencies that develop each skill, and a dashed line is this project's reading. Technology and Society and Project Knowledge and Skills carry most of the solid lines because every understanding competency lists them. Creativity, Autonomy, Ability to Deal with Obstacles, Intellectual Development, Critical Thinking and Problem Solving, Systems Design, Structure and Project Management have no line.",
      "wef30-ocean": "<b>The ten skills growing fastest to 2030, against the ten Ocean Decade challenges.</b> Neither source links the two, so every line is this project's reading: solid where the challenge is mainly that skill, dashed where the skill is a real piece of it. Every challenge has a line; challenge 3, challenge 4, challenge 5 and challenge 7 has only a dashed one.",
      "ocean-wef30": "<b>The same links, read from the Ocean Decade side.</b> Pick a challenge on the left to see which of the 2030 skills it calls for. Solid lines mean the challenge is mainly that skill; dashed lines mean the skill is a real piece of it."
  };
  // END MATE AND OCEAN VIEWS

  // Everything a match-up view needs, keyed by view name.
  var MATCH_VIEWS = {
    match: {anchors: CTE_ANCHORS, links: CTE_LINKS, details: ANCHOR_DETAILS, covered: COVERED, rightTitle: "CTE anchor standards"},
    csta: {anchors: CSTA_ANCHORS, links: CSTA_LINKS, details: CSTA_DETAILS, covered: CSTA_COVERED, rightTitle: "CS practices &amp; concept strands"},
    csta3: {anchors: CSTA3_ANCHORS, links: CSTA3_LINKS, details: CSTA3_DETAILS, covered: CSTA3_COVERED, rightTitle: "2026 CSTA PK-12 Standards"}
  };

  var CAPTIONS = {
    now: "<b>AI is not on this list.</b> The skills employers call most essential right now are mostly human ones, ranked by the share of employers naming each a core skill.",
    growing: "<b>Now AI leaps to number one.</b> But the human skills do not fall away. Creativity, resilience, curiosity, and leadership all stay near the top of what is growing fastest.",
    cte: "<b>Most of this list was written into California's standards in 2013.</b> Coverage rates how fully each anchor standard covers the skill. The gaps are honest too: creative thinking is thin, and AI was not yet on anyone's radar.",
    match: "<b>Thirteen employer skills, eleven anchor standards.</b> Solid lines are direct matches, dashed lines partial ones. The one skill with no line, and the one standard nothing points to, tell their own story.",
    csta: "<b>Same thirteen skills, different document.</b> Against California's CS standards, the seven core practices and five concept strands, the gaps flip: AI &amp; big data finds a strong home and creative thinking becomes a whole practice, while motivation, curiosity, and environmental stewardship dangle. Once again, nothing points at the ethics strand.",
    csta3: "<b>Every skill now has a line.</b> Mapped against the 2026 CSTA PK-12 Computer Science Standards, published in July 2026, the last gaps close: persistence, curiosity, and reflectiveness arrive as named dispositions, environmental harm enters the ethics pillar, and AI runs through the Algorithms &amp; Design and Programming concepts, kindergarten onward. The one thing no employer skill points at, once again, is the Computing &amp; Society concept. The standards writers keep it anyway."
  };

  // Views for MATE and the Ocean Decade come from the generated block above.
  Object.keys(MATE_OCEAN.matchViews).forEach(function (k) { MATCH_VIEWS[k] = MATE_OCEAN.matchViews[k]; });
  Object.keys(MATE_OCEAN.captions).forEach(function (k) { CAPTIONS[k] = MATE_OCEAN.captions[k]; });

  SW.registerDataset("wef-skills", {
    percentMax: 80,
    bars: { now: NOW, growing: GROWING, ocean: MATE_OCEAN.bars.ocean },
    skills: CTE,
    matchViews: MATCH_VIEWS,
    captions: CAPTIONS
  });
})(window.SkillsWidget);
