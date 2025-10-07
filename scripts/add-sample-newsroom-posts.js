const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://abgdev:0C1dpfnsCs8ta1lCnT1Fx8ye%2Fz1mP2kMAcCENRQFDfU%3D@159.89.229.112:27017/abg-website';

async function addSamplePosts() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('NewsroomPost');
    
    // Sample posts
    const samplePosts = [
      {
        title: 'Welcome to the ABG Newsroom',
        slug: 'welcome-to-abg-newsroom',
        type: 'blog',
        status: 'published',
        thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop',
        description: 'Introducing our new newsroom featuring the latest updates, insights, and stories from the AI Business Group community.',
        body: `<h2>Welcome to Our New Newsroom</h2>

<p>We're excited to launch our new newsroom - a centralized hub for all the latest news, insights, and stories from the AI Business Group at the University of Michigan.</p>

<h3>What You'll Find Here</h3>

<ul>
<li><strong>Articles:</strong> In-depth analysis and insights on AI business trends</li>
<li><strong>Podcasts:</strong> Conversations with industry leaders and thought leaders</li>
<li><strong>Videos:</strong> Educational content and event highlights</li>
<li><strong>Member Spotlights:</strong> Featuring our amazing community members</li>
<li><strong>Project Updates:</strong> Latest developments from our ongoing initiatives</li>
</ul>

<h3>Stay Connected</h3>

<p>Make sure to check back regularly for new content, or follow us on our social media channels to get notified when we publish new posts.</p>

<p>We're committed to providing valuable, engaging content that keeps our community informed and connected. Welcome to the ABG Newsroom!</p>`,
        mediaEmbedLink: '',
        author: 'ABG Editorial Team',
        authorEmail: 'admin@aibusinessgroup.org',
        datePublished: new Date(),
        featured: true,
        tags: ['announcement', 'community', 'newsroom'],
        seoTitle: 'Welcome to the ABG Newsroom | AI Business Group',
        seoDescription: 'Introducing our new newsroom featuring the latest updates, insights, and stories from the AI Business Group community.',
        openGraphImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=630&fit=crop',
        analytics: {
          views: 0,
          uniqueViews: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'The Future of AI in Business: Trends to Watch',
        slug: 'future-of-ai-in-business-trends',
        type: 'blog',
        status: 'published',
        thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop',
        description: 'Exploring the key artificial intelligence trends that will shape the business landscape in the coming years.',
        body: `<h2>The AI Revolution is Just Beginning</h2>

<p>Artificial Intelligence is no longer a futuristic concept—it's a present reality reshaping how businesses operate, compete, and create value. As we look ahead, several key trends are emerging that will define the next phase of AI adoption in business.</p>

<h3>Key Trends to Watch</h3>

<h4>1. Generative AI Goes Mainstream</h4>
<p>Beyond chatbots, generative AI is revolutionizing content creation, software development, and creative industries. Companies are finding innovative ways to integrate these capabilities into their workflows.</p>

<h4>2. AI-Powered Automation</h4>
<p>Robotic Process Automation (RPA) combined with AI is creating intelligent automation solutions that can handle complex decision-making processes.</p>

<h4>3. Ethical AI and Governance</h4>
<p>As AI becomes more prevalent, companies are investing heavily in ethical AI frameworks and governance structures to ensure responsible deployment.</p>

<h4>4. Edge AI Computing</h4>
<p>Processing AI workloads closer to data sources is reducing latency and improving privacy, enabling real-time decision making in critical applications.</p>

<h3>Preparing for the Future</h3>

<p>Organizations that want to stay competitive must start preparing now by investing in AI talent, infrastructure, and strategic planning. The companies that succeed will be those that can effectively integrate AI into their core business processes while maintaining human-centered values.</p>`,
        mediaEmbedLink: '',
        author: 'Sarah Chen',
        authorEmail: 'sarahchen@umich.edu',
        datePublished: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        featured: false,
        tags: ['ai-trends', 'business-strategy', 'future-tech'],
        seoTitle: 'The Future of AI in Business: 4 Trends to Watch | ABG',
        seoDescription: 'Exploring the key artificial intelligence trends that will shape the business landscape in the coming years.',
        openGraphImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=630&fit=crop',
        analytics: {
          views: 157,
          uniqueViews: 132
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Member Spotlight: John Davis, AI Research Lead',
        slug: 'member-spotlight-john-davis',
        type: 'member-spotlight',
        status: 'published',
        thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
        description: 'Meet John Davis, one of our outstanding members who is making waves in AI research and development.',
        body: `<h2>Meet John Davis</h2>

<p>John Davis is a senior at the University of Michigan studying Computer Science with a focus on Machine Learning. As one of our most active members, John has been instrumental in leading several key research initiatives within ABG.</p>

<h3>Current Projects</h3>

<p>John is currently working on a groundbreaking project that applies natural language processing to financial document analysis. His work has the potential to revolutionize how financial institutions process and understand complex regulatory documents.</p>

<blockquote>
<p>"The intersection of AI and business is where I find the most exciting opportunities. ABG has provided me with the platform to explore these possibilities and work with like-minded individuals." - John Davis</p>
</blockquote>

<h3>Achievements</h3>

<ul>
<li>Led the development of our automated sentiment analysis tool</li>
<li>Presented research at the 2024 AI in Finance Conference</li>
<li>Mentored 5+ junior members in machine learning fundamentals</li>
<li>Published paper on "Ethical Considerations in Financial AI" in the Michigan Journal of Business</li>
</ul>

<h3>Looking Ahead</h3>

<p>After graduation, John plans to pursue a PhD in Machine Learning while continuing to consult on AI business applications. His goal is to bridge the gap between cutting-edge research and practical business implementation.</p>

<p>John's dedication and innovative thinking exemplify the caliber of talent we're proud to have in ABG. We look forward to following his continued success!</p>`,
        mediaEmbedLink: '',
        author: 'Emily Rodriguez',
        authorEmail: 'emilyrod@umich.edu',
        datePublished: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        featured: false,
        tags: ['member-spotlight', 'research', 'machine-learning'],
        seoTitle: 'Member Spotlight: John Davis, AI Research Lead | ABG',
        seoDescription: 'Meet John Davis, one of our outstanding members who is making waves in AI research and development.',
        openGraphImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=630&fit=crop',
        analytics: {
          views: 89,
          uniqueViews: 76
        },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        title: 'Tech Talks Podcast: ChatGPT and the Future of Work',
        slug: 'tech-talks-podcast-chatgpt-future-work',
        type: 'podcast',
        status: 'published',
        thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=400&fit=crop',
        description: 'In this episode, we discuss how ChatGPT and similar AI tools are reshaping the modern workplace and what it means for the future of work.',
        body: `<h2>Episode Overview</h2>

<p>In this thought-provoking episode of Tech Talks, we dive deep into the transformative impact of ChatGPT and large language models on the modern workplace. Our host sits down with industry experts to explore both the opportunities and challenges these technologies present.</p>

<h3>Key Discussion Points</h3>

<ul>
<li><strong>Productivity Revolution:</strong> How AI tools are boosting productivity across industries</li>
<li><strong>Job Displacement Concerns:</strong> Which roles are at risk and which are safe</li>
<li><strong>Skill Adaptation:</strong> What new skills professionals need to develop</li>
<li><strong>Ethical Considerations:</strong> Ensuring fair and responsible AI implementation</li>
</ul>

<h3>Guest Speakers</h3>

<p>We're joined by:</p>
<ul>
<li><strong>Dr. Amanda Walker</strong> - Professor of Business Technology at Michigan Ross</li>
<li><strong>Marcus Johnson</strong> - VP of AI Strategy at TechCorp</li>
<li><strong>Lisa Chen</strong> - Workforce Development Specialist</li>
</ul>

<h3>Key Takeaways</h3>

<p>The conversation reveals that while AI will indeed change how we work, the focus should be on augmentation rather than replacement. Professionals who embrace these tools and develop complementary skills will thrive in the AI-enhanced workplace.</p>

<p>Listen to the full episode using the player below, and don't forget to subscribe to our podcast for more insights into the intersection of AI and business!</p>`,
        mediaEmbedLink: 'https://open.spotify.com/episode/example123',
        author: 'Michael Torres',
        authorEmail: 'mtorres@umich.edu',
        datePublished: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        featured: true,
        tags: ['podcast', 'chatgpt', 'future-of-work', 'ai-tools'],
        seoTitle: 'Tech Talks Podcast: ChatGPT and the Future of Work | ABG',
        seoDescription: 'In this episode, we discuss how ChatGPT and similar AI tools are reshaping the modern workplace and what it means for the future of work.',
        openGraphImage: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=630&fit=crop',
        analytics: {
          views: 234,
          uniqueViews: 198
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ];
    
    // Insert sample posts
    for (const post of samplePosts) {
      // Check if post with same slug already exists
      const existing = await collection.findOne({ slug: post.slug });
      if (!existing) {
        await collection.insertOne(post);
        console.log(`✅ Added sample post: ${post.title}`);
      } else {
        console.log(`⏭️  Post already exists: ${post.title}`);
      }
    }
    
    console.log('\n🎉 Sample newsroom posts have been added successfully!');
    
    const totalPosts = await collection.countDocuments();
    console.log(`📊 Total posts in collection: ${totalPosts}`);
    
  } catch (error) {
    console.error('❌ Error adding sample posts:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

addSamplePosts();