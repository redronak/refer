import { useState, useEffect, useCallback, useRef } from "react";

const API = process.env.NODE_ENV === "production"
  ? "https://learntok-backend-2026-24c204fe508e.herokuapp.com/bounty"
  : "http://localhost:9000/bounty";

// ── Creator category master data ──────────────────────────────────────────────
const CREATOR_CATS = [
  { id:"twitter", icon:"🐦", label:"Twitter / X", brandsOnlyLabel:"Hide pricing — only verified brands can book",
    services:[
      {id:"post",      label:"Sponsored Post",          desc:"Single branded tweet to your followers"},
      {id:"thread",    label:"Sponsored Thread",         desc:"Multi-tweet story thread for your brand"},
      {id:"retainer",  label:"Monthly Retainer",         desc:"4+ posts/month ongoing partnership"},
      {id:"space",     label:"Space Co-host",            desc:"Live Twitter Space with your brand"},
      {id:"quote",     label:"Quote Tweet Campaign",     desc:"Quote tweet with brand commentary"},
      {id:"ugc",       label:"Twitter/X Ad UGC",         desc:"Content repurposable for X ads"},
      {id:"launch",    label:"Product Launch Tweet",     desc:"Dedicated launch announcement"},
      {id:"giveaway",  label:"Giveaway Host",            desc:"Run a branded giveaway on my account"},
      {id:"mention",   label:"Brand Mention (organic)",  desc:"Casual authentic mention in content"},
    ]},
  { id:"newsletter", icon:"📧", label:"Newsletter", brandsOnlyLabel:"Hide pricing — only verified brands can book",
    services:[
      {id:"dedicated",  label:"Dedicated Send",           desc:"Full newsletter dedicated to your brand"},
      {id:"sponsor",    label:"Newsletter Sponsor",       desc:"Top or mid-roll ad in my newsletter"},
      {id:"collab",     label:"Co-authored Issue",        desc:"Write together, both audiences"},
      {id:"retainer",   label:"Monthly Retainer",         desc:"Recurring ad slot every issue"},
      {id:"welcome",    label:"Welcome Email Feature",    desc:"Featured in my onboarding sequence"},
      {id:"classified", label:"Classified Ad",            desc:"Short text ad in my classifieds section"},
      {id:"review",     label:"Product Review Issue",     desc:"Deep-dive review of your product"},
      {id:"casestudy",  label:"Case Study Feature",       desc:"Spotlight your customer success story"},
      {id:"interview",  label:"Interview Feature",        desc:"Interview your founder or team"},
      {id:"survey",     label:"Sponsored Survey",         desc:"Survey my audience on your behalf"},
      {id:"job",        label:"Job Listing Feature",      desc:"Post your job opening to my readers"},
      {id:"event",      label:"Event Promotion",          desc:"Promote your event or conference"},
      {id:"affiliate",  label:"Affiliate Promotion",      desc:"Commission-based newsletter mention"},
      {id:"roundup",    label:"Tool Roundup Feature",     desc:"Include your tool in a curated list"},
      {id:"discount",   label:"Exclusive Discount Drop",  desc:"Share an exclusive deal with readers"},
      {id:"annual",     label:"Annual Sponsorship",       desc:"Lock in 12 months of recurring mentions"},
      {id:"webinar",    label:"Webinar Promotion",        desc:"Drive registrations to your webinar"},
      {id:"resource",   label:"Resource Sponsorship",     desc:"Sponsor a free resource I share"},
      {id:"digest",     label:"Niche Digest Feature",     desc:"Curated mention in my niche digest"},
      {id:"vendor",     label:"Cold Outreach List",       desc:"Feature in my curated vendor list"},
    ]},
  { id:"youtube", icon:"📺", label:"YouTube", brandsOnlyLabel:"Hide pricing — only verified brands can book",
    services:[
      {id:"integration", label:"Brand Integration",      desc:"30–60 sec brand mention in video"},
      {id:"dedicated",   label:"Dedicated Video",        desc:"Full video about your product"},
      {id:"short",       label:"YouTube Short",          desc:"60-second short-form promotion"},
      {id:"retainer",    label:"Monthly Retainer",       desc:"Regular integrations across videos"},
      {id:"preroll",     label:"Pre-roll Sponsorship",   desc:"Sponsored segment at video start"},
      {id:"endcard",     label:"End Card CTA",           desc:"Branded call-to-action at video end"},
      {id:"unboxing",    label:"Product Unboxing",       desc:"Unbox and review your product"},
      {id:"tutorial",    label:"Tutorial Feature",       desc:"Use your product in a how-to video"},
      {id:"comparison",  label:"Comparison Video",       desc:"Feature your product in a vs video"},
      {id:"daylife",     label:"Day-in-the-Life Feature",desc:"Naturally integrate your brand"},
      {id:"vlog",        label:"Vlog Integration",       desc:"Organic mention in a vlog"},
      {id:"series",      label:"Series Sponsorship",     desc:"Sponsor an entire video series"},
      {id:"community",   label:"Community Post",         desc:"Branded post to my subscribers"},
      {id:"live",        label:"Live Stream Sponsor",    desc:"Brand mention during live stream"},
      {id:"giveaway",    label:"Giveaway Video",         desc:"Host a giveaway featuring your product"},
      {id:"trailer",     label:"Channel Trailer Feature",desc:"Brand mention in my channel trailer"},
      {id:"testimonial", label:"Testimonial Video",      desc:"Authentic video review of your product"},
      {id:"bts",         label:"Behind-the-Scenes",      desc:"Feature your brand's backstory"},
      {id:"demo",        label:"App Demo Video",         desc:"Walk through your app or software"},
      {id:"interview",   label:"Interview/Podcast Collab",desc:"Video interview with your team"},
    ]},
  { id:"tiktok", icon:"🎵", label:"TikTok", brandsOnlyLabel:"Hide pricing — only verified brands can book",
    services:[
      {id:"post",        label:"Sponsored TikTok",       desc:"Branded TikTok video"},
      {id:"series",      label:"Series (3 videos)",      desc:"3-part branded content series"},
      {id:"ugc",         label:"UGC Content",            desc:"Raw footage for your own ads"},
      {id:"retainer",    label:"Monthly Retainer",       desc:"Ongoing TikTok partnership"},
      {id:"sound",       label:"Trending Sound Integration",desc:"Use your sound in a viral format"},
      {id:"demo",        label:"Product Demo",           desc:"Showcase your product in action"},
      {id:"unboxing",    label:"Unboxing Video",         desc:"Unbox and react to your product"},
      {id:"stitch",      label:"Stitch / Duet",          desc:"Respond to your brand's video"},
      {id:"tutorial",    label:"Tutorial TikTok",        desc:"How-to using your product"},
      {id:"daylife",     label:"Day-in-the-Life Feature",desc:"Integrate your brand naturally"},
      {id:"live",        label:"TikTok Live Sponsor",    desc:"Brand mention during live"},
      {id:"challenge",   label:"Hashtag Challenge",      desc:"Launch a branded challenge"},
      {id:"transition",  label:"Trending Transition",    desc:"Use viral format to feature brand"},
      {id:"comments",    label:"Comment Engagement Boost",desc:"Drive comments to your account"},
      {id:"appdownload", label:"App Download Push",      desc:"Drive installs with a CTA"},
      {id:"beforeafter", label:"Before & After",         desc:"Transformation using your product"},
      {id:"pov",         label:"POV Format",             desc:"Branded first-person storytelling"},
      {id:"greenscreen", label:"Green Screen Feature",   desc:"Creative branded green screen video"},
      {id:"reaction",    label:"Reaction Video",         desc:"React to your product or campaign"},
      {id:"takeover",    label:"Brand Takeover Collab",  desc:"Co-create content with your team"},
    ]},
  { id:"instagram", icon:"📸", label:"Instagram", brandsOnlyLabel:"Hide pricing — only verified brands can book",
    services:[
      {id:"post",        label:"Feed Post",              desc:"Branded Instagram post"},
      {id:"stories",     label:"Story Set (3)",          desc:"Three branded story frames"},
      {id:"reel",        label:"Reel",                   desc:"Branded Reel video"},
      {id:"retainer",    label:"Monthly Retainer",       desc:"Ongoing Instagram partnership"},
      {id:"carousel",    label:"Carousel Post",          desc:"Multi-slide educational or branded carousel"},
      {id:"live",        label:"Instagram Live Sponsor", desc:"Brand mention during live"},
      {id:"collab",      label:"Collab Post",            desc:"Co-authored post with your brand account"},
      {id:"styling",     label:"Product Styling Shot",   desc:"Aesthetic photo featuring your product"},
      {id:"ugc",         label:"UGC Content Pack",       desc:"Raw photos/videos for your ads"},
      {id:"poll",        label:"Story Poll / Quiz",      desc:"Interactive branded poll in Stories"},
      {id:"linkinbio",   label:"Link in Bio Feature",    desc:"Dedicated link in bio slot"},
      {id:"giveaway",    label:"Giveaway Post",          desc:"Host a branded giveaway"},
      {id:"event",       label:"Event Coverage",         desc:"Cover your event on my account"},
      {id:"bts",         label:"Behind-the-Scenes Reel", desc:"BTS of using your product"},
      {id:"testimonial", label:"Testimonial Post",       desc:"Authentic review post"},
      {id:"highlight",   label:"Highlight Feature",      desc:"Permanent story highlight for your brand"},
      {id:"guide",       label:"Instagram Guide",        desc:"Curated guide featuring your product"},
      {id:"affiliate",   label:"Affiliate Post",         desc:"Commission-based post with swipe-up"},
      {id:"appdownload", label:"App Download Story",     desc:"Drive installs via story swipe-up"},
      {id:"seasonal",    label:"Seasonal Campaign",      desc:"Holiday or campaign-specific content"},
    ]},
  { id:"podcast", icon:"🎙️", label:"Podcast", brandsOnlyLabel:"Hide pricing — brands only",
    services:[
      {id:"hostread",    label:"Host-Read Ad",           desc:"Personal host-read mid-roll ad"},
      {id:"episode",     label:"Episode Sponsor",        desc:"Full episode sponsorship"},
      {id:"guest",       label:"Guest Appearance",       desc:"Interview or guest feature"},
      {id:"retainer",    label:"Monthly Sponsor",        desc:"Recurring monthly sponsorship"},
      {id:"preroll",     label:"Pre-roll Ad",            desc:"15–30 sec ad at episode start"},
      {id:"postroll",    label:"Post-roll Ad",           desc:"Ad at end of episode"},
      {id:"dedicated",   label:"Dedicated Episode",      desc:"Full episode about your brand"},
      {id:"bundle",      label:"Multi-episode Bundle",   desc:"Sponsor 3–5 consecutive episodes"},
      {id:"shownotes",   label:"Show Notes Feature",     desc:"Brand link and blurb in show notes"},
      {id:"newsletter",  label:"Newsletter Cross-promo", desc:"Promote your brand to my email list"},
      {id:"live",        label:"Live Podcast Sponsor",   desc:"Brand mention at live recording"},
      {id:"season",      label:"Season Sponsorship",     desc:"Sponsor an entire podcast season"},
      {id:"bonus",       label:"Bonus Episode",          desc:"Produce a bonus episode for your brand"},
      {id:"transcript",  label:"Transcript Sponsor",     desc:"Brand mention in episode transcript"},
      {id:"community",   label:"Community Shoutout",     desc:"Mention in my listener community"},
      {id:"review",      label:"Product Review Episode", desc:"Deep-dive review of your product"},
      {id:"cohost",      label:"Co-hosted Episode",      desc:"Co-host an episode with your team"},
      {id:"segment",     label:"Branded Segment",        desc:"Recurring branded segment each episode"},
      {id:"event",       label:"Event Promotion",        desc:"Promote your conference or webinar"},
      {id:"referral",    label:"Referral Code Read",     desc:"Personal referral code in every episode"},
    ]},
  { id:"community", icon:"👥", label:"Community / Discord", brandsOnlyLabel:"Hide pricing — brands only",
    services:[
      {id:"announcement",label:"Announcement",           desc:"Brand post in my community"},
      {id:"ama",         label:"Brand AMA",              desc:"AMA session with your team"},
      {id:"beta",        label:"Beta Access",            desc:"Early access to your product"},
      {id:"retainer",    label:"Monthly Partner",        desc:"Ongoing community partnership"},
      {id:"pinned",      label:"Pinned Brand Post",      desc:"Pinned promotion in main channel"},
      {id:"channel",     label:"Sponsored Channel",      desc:"Dedicated channel for your brand"},
      {id:"weekly",      label:"Weekly Mention",         desc:"Regular mention in weekly roundup"},
      {id:"resource",    label:"Resource Drop",          desc:"Share your resource or tool with members"},
      {id:"job",         label:"Job Posting",            desc:"Post your open role to my community"},
      {id:"discount",    label:"Exclusive Discount",     desc:"Drop an exclusive deal for members"},
      {id:"workshop",    label:"Workshop Host",          desc:"Host a branded workshop for my community"},
      {id:"officehours", label:"Office Hours Sponsor",   desc:"Sponsor my community office hours"},
      {id:"giveaway",    label:"Giveaway",               desc:"Run a giveaway exclusively for members"},
      {id:"demo",        label:"Product Demo Session",   desc:"Live demo of your product"},
      {id:"newsletter",  label:"Newsletter Promo",       desc:"Feature your newsletter to my members"},
      {id:"survey",      label:"Community Survey",       desc:"Survey my members on your behalf"},
      {id:"referral",    label:"Referral Program Launch",desc:"Introduce your referral program"},
      {id:"onboarding",  label:"Onboarding Feature",     desc:"Include your tool in member onboarding"},
      {id:"event",       label:"Event Promotion",        desc:"Promote your event to my community"},
      {id:"cobranded",   label:"Co-branded Resource",    desc:"Create a resource together"},
    ]},
  { id:"speaking", icon:"🎤", label:"Speaking / Advisory", brandsOnlyLabel:"Hide pricing — brands only",
    services:[
      {id:"keynote",     label:"Keynote Talk",           desc:"Speaking slot at your event"},
      {id:"panel",       label:"Panel Appearance",       desc:"Panel or roundtable"},
      {id:"advisor",     label:"Advisory (monthly)",     desc:"Ongoing strategic advisory"},
      {id:"workshop",    label:"Workshop",               desc:"Interactive workshop for your team"},
      {id:"fireside",    label:"Fireside Chat",          desc:"Intimate conversation format at your event"},
      {id:"webinar",     label:"Webinar Speaker",        desc:"Present at your webinar"},
      {id:"conference",  label:"Conference Talk",        desc:"Full conference speaking slot"},
      {id:"podguest",    label:"Podcast Guest",          desc:"Appear on your podcast"},
      {id:"interview",   label:"Video Interview",        desc:"Recorded interview for your content"},
      {id:"course",      label:"Course Contribution",    desc:"Contribute a module to your course"},
      {id:"fractional",  label:"Fractional Advisor",     desc:"Part-time advisory engagement"},
      {id:"officehours", label:"Office Hours",           desc:"Open Q&A session for your team"},
      {id:"training",    label:"Team Training",          desc:"Train your team on my area of expertise"},
      {id:"pitchcoach",  label:"Investor Pitch Coach",   desc:"Help founders prep for investor meetings"},
      {id:"strategy",    label:"Strategy Session (1hr)", desc:"One-time deep-dive strategy call"},
      {id:"retreat",     label:"Retreat Facilitator",    desc:"Facilitate your team retreat"},
      {id:"awards",      label:"Award Ceremony Host",    desc:"MC or host your awards event"},
      {id:"judge",       label:"Demo Day Judge",         desc:"Judge at your accelerator demo day"},
      {id:"mentor",      label:"Mentorship Session",     desc:"One-on-one mentoring session"},
      {id:"briefing",    label:"Executive Briefing",     desc:"Private briefing for your leadership team"},
    ]},
  { id:"writing", icon:"✍️", label:"Writing / Content", brandsOnlyLabel:"Hide pricing — brands only",
    services:[
      {id:"article",     label:"Article / Blog Post",    desc:"Long-form article for your brand"},
      {id:"ghostwrite",  label:"Ghostwriting",           desc:"Write in your voice for your platform"},
      {id:"copywriting", label:"Copywriting",            desc:"Landing page, emails, or ads copy"},
      {id:"retainer",    label:"Monthly Retainer",       desc:"Ongoing content production"},
      {id:"linkedin",    label:"LinkedIn Post",          desc:"Write branded LinkedIn content"},
      {id:"email",       label:"Email Newsletter",       desc:"Write your brand's newsletter"},
      {id:"whitepaper",  label:"White Paper",            desc:"In-depth research paper for your brand"},
      {id:"casestudy",   label:"Case Study",             desc:"Write a customer success story"},
      {id:"seo",         label:"SEO Blog Post",          desc:"Keyword-optimized post for your site"},
      {id:"productdesc", label:"Product Description",    desc:"Write compelling product copy"},
      {id:"press",       label:"Press Release",          desc:"Announce your news professionally"},
      {id:"social",      label:"Social Media Copy",      desc:"Write captions for your channels"},
      {id:"script",      label:"Video Script",           desc:"Script for YouTube, TikTok, or ads"},
      {id:"pitchdeck",   label:"Pitch Deck Copy",        desc:"Write the narrative for your deck"},
      {id:"website",     label:"Website Copy",           desc:"Homepage, about, or feature page copy"},
      {id:"emailseq",    label:"Email Sequence",         desc:"Write a multi-step drip campaign"},
      {id:"annual",      label:"Annual Report",          desc:"Write your company annual report"},
      {id:"ebook",       label:"eBook / Lead Magnet",    desc:"Create a downloadable resource"},
      {id:"grant",       label:"Grant Writing",          desc:"Write grant proposals for your org"},
      {id:"technical",   label:"Technical Writing",      desc:"Documentation or technical guides"},
    ]},
  { id:"hired", icon:"💼", label:"Hire Me", brandsOnlyLabel:"Show to verified brands only",
    services:[
      {id:"fulltime",    label:"Full-time Role",         desc:"Open to full-time opportunities"},
      {id:"parttime",    label:"Part-time / Fractional", desc:"Available for part-time work"},
      {id:"contract",    label:"Project Contract",       desc:"Fixed-scope project engagement"},
      {id:"cofounder",   label:"Co-founder",             desc:"Open to co-founding opportunities"},
      {id:"sprint",      label:"Freelance Sprint",       desc:"Short intensive project (1–2 weeks)"},
      {id:"interim",     label:"Interim Role",           desc:"Step in while you hire permanently"},
      {id:"consulting",  label:"Consulting Retainer",    desc:"Monthly consulting engagement"},
      {id:"embedded",    label:"Embedded Contractor",    desc:"Work within your team full-time"},
      {id:"revshare",    label:"Revenue Share Deal",     desc:"Work in exchange for equity or rev share"},
      {id:"advisory",    label:"Advisory Role",          desc:"Formal advisory with equity"},
      {id:"agency",      label:"Agency Partnership",     desc:"White-label my services"},
      {id:"bundle",      label:"Speaking + Consulting",  desc:"Events plus ongoing advice"},
      {id:"augment",     label:"Team Augmentation",      desc:"Join your team for a specific sprint"},
      {id:"launch",      label:"Product Launch Partner", desc:"Help you launch a product"},
      {id:"gtm",         label:"Go-to-Market Support",   desc:"Help you enter a new market"},
      {id:"turnaround",  label:"Turnaround Specialist",  desc:"Fix a struggling team or product"},
      {id:"investor",    label:"Investor Outreach",      desc:"Help you get in front of investors"},
      {id:"hiring",      label:"Hiring / Recruiting",    desc:"Help you build your team"},
      {id:"board",       label:"Board Observer",         desc:"Informal board participation"},
      {id:"strategic",   label:"Strategic Partnership",  desc:"Long-term partnership deal"},
    ]},
  { id:"developer", icon:"💻", label:"Development", brandsOnlyLabel:"Show to verified brands only",
    services:[
      {id:"webapp",      label:"Web App / SaaS",         desc:"Build your web application"},
      {id:"api",         label:"API / Backend",          desc:"Backend or API development"},
      {id:"automation",  label:"Automation",             desc:"Workflow or process automation"},
      {id:"audit",       label:"Code Audit",             desc:"Review and improve existing code"},
      {id:"mvp",         label:"MVP Build",              desc:"Build your minimum viable product"},
      {id:"landing",     label:"Landing Page",           desc:"Design and build a landing page"},
      {id:"extension",   label:"Chrome Extension",       desc:"Build a browser extension"},
      {id:"ecommerce",   label:"Shopify / E-commerce",   desc:"Build or customize your store"},
      {id:"wordpress",   label:"WordPress Site",         desc:"Build or redesign your WordPress site"},
      {id:"mobile",      label:"Mobile App (React Native)",desc:"Cross-platform mobile app"},
      {id:"database",    label:"Database Design",        desc:"Architect your data model"},
      {id:"devops",      label:"DevOps / Infrastructure",desc:"Set up CI/CD, cloud, and infra"},
      {id:"ai",          label:"AI Integration",         desc:"Integrate LLMs or ML into your product"},
      {id:"payments",    label:"Payment Integration",    desc:"Add Stripe or other payment flows"},
      {id:"analytics",   label:"Analytics Setup",        desc:"Set up tracking and dashboards"},
      {id:"bugfix",      label:"Bug Fixing Sprint",      desc:"Fix a backlog of bugs fast"},
      {id:"perf",        label:"Performance Optimization",desc:"Speed up your existing app"},
      {id:"security",    label:"Security Audit",         desc:"Find and fix vulnerabilities"},
      {id:"cofounder",   label:"Technical Co-founder",   desc:"Be your technical co-founder"},
      {id:"handover",    label:"Codebase Handover",      desc:"Document and hand off your codebase"},
    ]},
  { id:"design", icon:"🎨", label:"Design", brandsOnlyLabel:"Show to verified brands only",
    services:[
      {id:"brand",       label:"Brand Identity",         desc:"Logo, colors, typography system"},
      {id:"ui",          label:"UI / UX Design",         desc:"Product interface design"},
      {id:"social",      label:"Social Assets",          desc:"Templates for social media"},
      {id:"deck",        label:"Pitch Deck",             desc:"Investor or sales presentation"},
      {id:"website",     label:"Website Redesign",       desc:"Full website visual overhaul"},
      {id:"landing",     label:"Landing Page Design",    desc:"High-converting page design"},
      {id:"mobile",      label:"Mobile App Design",      desc:"iOS or Android interface design"},
      {id:"icons",       label:"Icon Pack",              desc:"Custom icon set for your product"},
      {id:"illustration",label:"Illustration",           desc:"Custom illustrations for your brand"},
      {id:"infographic", label:"Infographic",            desc:"Data visualization or explainer graphic"},
      {id:"email",       label:"Email Template",         desc:"Branded HTML email template"},
      {id:"print",       label:"Print Design",           desc:"Brochures, flyers, or signage"},
      {id:"packaging",   label:"Packaging Design",       desc:"Product packaging and labels"},
      {id:"motion",      label:"Motion Graphics",        desc:"Animated logos or social videos"},
      {id:"designsys",   label:"Design System",          desc:"Component library and style guide"},
      {id:"figma",       label:"Figma File Audit",       desc:"Review and improve your Figma files"},
      {id:"adcreative",  label:"Ad Creative",            desc:"Banners and display ad designs"},
      {id:"thumbnail",   label:"Video Thumbnail",        desc:"YouTube or social video thumbnails"},
      {id:"merch",       label:"Merch Design",           desc:"T-shirts, hoodies, and swag design"},
      {id:"annual",      label:"Annual Report Design",   desc:"Designed company annual report"},
    ]},
  { id:"marketing", icon:"📣", label:"Marketing", brandsOnlyLabel:"Show to verified brands only",
    services:[
      {id:"strategy",    label:"Marketing Strategy",     desc:"Go-to-market or growth strategy"},
      {id:"seo",         label:"SEO",                    desc:"Search engine optimisation"},
      {id:"paid",        label:"Paid Ads",               desc:"Google, Meta, or LinkedIn ads"},
      {id:"email",       label:"Email Marketing",        desc:"Email campaigns and automations"},
      {id:"content",     label:"Content Strategy",       desc:"Plan your content calendar"},
      {id:"social",      label:"Social Media Management",desc:"Manage your social accounts"},
      {id:"influencer",  label:"Influencer Strategy",    desc:"Plan and run influencer campaigns"},
      {id:"pr",          label:"PR Strategy",            desc:"Plan your media and press outreach"},
      {id:"community",   label:"Community Growth",       desc:"Grow and engage your audience"},
      {id:"growth",      label:"Growth Hacking",         desc:"Rapid experimentation for growth"},
      {id:"cro",         label:"CRO (Conversion Rate)",  desc:"Optimize your funnel"},
      {id:"affiliate",   label:"Affiliate Program Setup",desc:"Launch your affiliate program"},
      {id:"producthunt", label:"Product Hunt Launch",    desc:"Plan and execute a PH launch"},
      {id:"positioning", label:"Brand Positioning",      desc:"Define your positioning and messaging"},
      {id:"competitive", label:"Competitive Analysis",   desc:"Map out your competitive landscape"},
      {id:"launch",      label:"Launch Strategy",        desc:"End-to-end product launch plan"},
      {id:"partnership", label:"Partnership Strategy",   desc:"Identify and close brand partners"},
      {id:"video",       label:"Video Marketing",        desc:"YouTube or social video strategy"},
      {id:"podcast",     label:"Podcast Marketing",      desc:"Get on podcasts and grow via audio"},
      {id:"referral",    label:"Referral Program",       desc:"Design and launch a referral loop"},
    ]},
  { id:"sales", icon:"🤝", label:"Sales / BD", brandsOnlyLabel:"Show to verified brands only",
    services:[
      {id:"intro",       label:"Warm Intro",             desc:"Intro to a potential customer or partner"},
      {id:"outreach",    label:"Cold Outreach",          desc:"Targeted outreach on your behalf"},
      {id:"closing",     label:"Deal Closing",           desc:"Help close a specific deal"},
      {id:"retainer",    label:"Monthly BD",             desc:"Ongoing business development"},
      {id:"script",      label:"Sales Script",           desc:"Write your sales scripts and templates"},
      {id:"crm",         label:"CRM Setup",              desc:"Set up and configure your CRM"},
      {id:"pipeline",    label:"Pipeline Review",        desc:"Audit and improve your sales pipeline"},
      {id:"training",    label:"Sales Training",         desc:"Train your team on closing deals"},
      {id:"partnership", label:"Partnership Outreach",   desc:"Reach out to potential partners"},
      {id:"investor",    label:"Investor Intro",         desc:"Warm intro to an investor"},
      {id:"channel",     label:"Channel Partner Recruitment",desc:"Find resellers or distributors"},
      {id:"demo",        label:"Demo Call Support",      desc:"Join your team on demo calls"},
      {id:"proposal",    label:"Proposal Writing",       desc:"Write winning sales proposals"},
      {id:"linkedin",    label:"LinkedIn Outreach",      desc:"Targeted LinkedIn prospecting"},
      {id:"deck",        label:"Sales Deck",             desc:"Create a compelling sales presentation"},
      {id:"account",     label:"Account Management",     desc:"Manage key accounts for you"},
      {id:"winloss",     label:"Win/Loss Analysis",      desc:"Analyze why you win or lose deals"},
      {id:"enterprise",  label:"Enterprise Sales Support",desc:"Navigate complex enterprise deals"},
      {id:"events",      label:"Event Networking",       desc:"Represent your brand at events"},
      {id:"network",     label:"Referral Network Activation",desc:"Tap into my network for leads"},
    ]},
  { id:"finance", icon:"💰", label:"Finance / Fundraising", brandsOnlyLabel:"Show to verified brands only",
    services:[
      {id:"intro_vc",    label:"VC Intro",               desc:"Warm intro to a VC or investor"},
      {id:"deck",        label:"Deck Review",            desc:"Feedback on your pitch deck"},
      {id:"model",       label:"Financial Model",        desc:"Build or review your financial model"},
      {id:"advisory",    label:"Fundraise Advisory",     desc:"Ongoing fundraising support"},
      {id:"angel",       label:"Angel Intro",            desc:"Intro to an angel investor"},
      {id:"termsheet",   label:"Term Sheet Review",      desc:"Help you understand your term sheet"},
      {id:"captable",    label:"Cap Table Modeling",     desc:"Model your cap table and dilution"},
      {id:"update",      label:"Investor Update Writing",desc:"Write your monthly investor update"},
      {id:"grantresearch",label:"Grant Research",        desc:"Find and shortlist relevant grants"},
      {id:"grant",       label:"Grant Writing",          desc:"Write grant proposals for your org"},
      {id:"revenue",     label:"Revenue Modeling",       desc:"Forecast your revenue scenarios"},
      {id:"budget",      label:"Budget Planning",        desc:"Build your annual budget"},
      {id:"unitec",      label:"Unit Economics Analysis",desc:"Break down your LTV / CAC"},
      {id:"ma",          label:"M&A Advisory",           desc:"Help with acquisition or merger process"},
      {id:"dd",          label:"Due Diligence Support",  desc:"Help you prepare for investor DD"},
      {id:"cfo",         label:"CFO Advisory",           desc:"Fractional CFO support"},
      {id:"cashflow",    label:"Cash Flow Modeling",     desc:"Model your runway and burn"},
      {id:"narrative",   label:"Fundraising Narrative",  desc:"Write your investor story"},
      {id:"crowdfund",   label:"Crowdfunding Strategy",  desc:"Plan your crowdfunding campaign"},
      {id:"finreview",   label:"Strategic Finance Review",desc:"Full financial health audit"},
    ]},
];



// ── Country codes for phone input ─────────────────────────────────────────────
const COUNTRIES=[
  {code:"US",dial:"+1",flag:"🇺🇸",name:"United States"},
  {code:"GB",dial:"+44",flag:"🇬🇧",name:"United Kingdom"},
  {code:"CA",dial:"+1",flag:"🇨🇦",name:"Canada"},
  {code:"AU",dial:"+61",flag:"🇦🇺",name:"Australia"},
  {code:"IN",dial:"+91",flag:"🇮🇳",name:"India"},
  {code:"DE",dial:"+49",flag:"🇩🇪",name:"Germany"},
  {code:"FR",dial:"+33",flag:"🇫🇷",name:"France"},
  {code:"SG",dial:"+65",flag:"🇸🇬",name:"Singapore"},
  {code:"AE",dial:"+971",flag:"🇦🇪",name:"UAE"},
  {code:"NL",dial:"+31",flag:"🇳🇱",name:"Netherlands"},
  {code:"SE",dial:"+46",flag:"🇸🇪",name:"Sweden"},
  {code:"NO",dial:"+47",flag:"🇳🇴",name:"Norway"},
  {code:"DK",dial:"+45",flag:"🇩🇰",name:"Denmark"},
  {code:"CH",dial:"+41",flag:"🇨🇭",name:"Switzerland"},
  {code:"ES",dial:"+34",flag:"🇪🇸",name:"Spain"},
  {code:"IT",dial:"+39",flag:"🇮🇹",name:"Italy"},
  {code:"PT",dial:"+351",flag:"🇵🇹",name:"Portugal"},
  {code:"BR",dial:"+55",flag:"🇧🇷",name:"Brazil"},
  {code:"MX",dial:"+52",flag:"🇲🇽",name:"Mexico"},
  {code:"NZ",dial:"+64",flag:"🇳🇿",name:"New Zealand"},
  {code:"ZA",dial:"+27",flag:"🇿🇦",name:"South Africa"},
  {code:"NG",dial:"+234",flag:"🇳🇬",name:"Nigeria"},
  {code:"KE",dial:"+254",flag:"🇰🇪",name:"Kenya"},
  {code:"PH",dial:"+63",flag:"🇵🇭",name:"Philippines"},
  {code:"ID",dial:"+62",flag:"🇮🇩",name:"Indonesia"},
  {code:"PK",dial:"+92",flag:"🇵🇰",name:"Pakistan"},
  {code:"BD",dial:"+880",flag:"🇧🇩",name:"Bangladesh"},
  {code:"JP",dial:"+81",flag:"🇯🇵",name:"Japan"},
  {code:"KR",dial:"+82",flag:"🇰🇷",name:"South Korea"},
  {code:"MY",dial:"+60",flag:"🇲🇾",name:"Malaysia"},
  {code:"TH",dial:"+66",flag:"🇹🇭",name:"Thailand"},
  {code:"VN",dial:"+84",flag:"🇻🇳",name:"Vietnam"},
  {code:"EG",dial:"+20",flag:"🇪🇬",name:"Egypt"},
  {code:"GH",dial:"+233",flag:"🇬🇭",name:"Ghana"},
  {code:"AR",dial:"+54",flag:"🇦🇷",name:"Argentina"},
  {code:"CO",dial:"+57",flag:"🇨🇴",name:"Colombia"},
  {code:"PL",dial:"+48",flag:"🇵🇱",name:"Poland"},
  {code:"UA",dial:"+380",flag:"🇺🇦",name:"Ukraine"},
  {code:"TR",dial:"+90",flag:"🇹🇷",name:"Turkey"},
  {code:"SA",dial:"+966",flag:"🇸🇦",name:"Saudi Arabia"},
  {code:"IL",dial:"+972",flag:"🇮🇱",name:"Israel"},
  {code:"IE",dial:"+353",flag:"🇮🇪",name:"Ireland"},
  {code:"BE",dial:"+32",flag:"🇧🇪",name:"Belgium"},
  {code:"AT",dial:"+43",flag:"🇦🇹",name:"Austria"},
  {code:"FI",dial:"+358",flag:"🇫🇮",name:"Finland"},
  {code:"CZ",dial:"+420",flag:"🇨🇿",name:"Czech Republic"},
  {code:"HU",dial:"+36",flag:"🇭🇺",name:"Hungary"},
  {code:"RO",dial:"+40",flag:"🇷🇴",name:"Romania"},
  {code:"HR",dial:"+385",flag:"🇭🇷",name:"Croatia"},
  {code:"SK",dial:"+421",flag:"🇸🇰",name:"Slovakia"},
];

function PhoneInput({value, onChange, style={}, inputStyle={}, dark=false}){
  const [dialCode,setDialCode]=useState("+1");
  const [num,setNum]=useState("");
  const [open,setOpen]=useState(false);
  const [search,setSearch]=useState("");
  const ref=useRef(null);

  // Close dropdown on outside click
  useEffect(()=>{
    const handler=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",handler);
    return()=>document.removeEventListener("mousedown",handler);
  },[]);

  const update=(dial,n)=>{
    const full=`${dial}${n.replace(/\D/g,"")}`;
    onChange(full);
  };

  const filtered=search?COUNTRIES.filter(c=>
    c.name.toLowerCase().includes(search.toLowerCase())||
    c.dial.includes(search)||c.code.toLowerCase().includes(search.toLowerCase())
  ):COUNTRIES;

  const base={display:"flex",gap:0,alignItems:"stretch",...style};
  const bg=dark?"rgba(255,255,255,.08)":"#f9fafb";
  const border=dark?"1px solid rgba(255,255,255,.2)":"1.5px solid #e4e1d9";
  const color=dark?"#fff":"#0a0b0d";

  return(
    <div style={base} ref={ref}>
      {/* Dial code dropdown */}
      <div style={{position:"relative",flexShrink:0}}>
        <button type="button" onClick={()=>setOpen(!open)}
          style={{height:"100%",padding:"11px 10px",background:bg,border,borderRight:"none",borderRadius:"9px 0 0 9px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontFamily:"'Inter',sans-serif",fontSize:14,color,minWidth:78,whiteSpace:"nowrap"}}>
          <span>{COUNTRIES.find(c=>c.dial===dialCode)?.flag||"🌍"}</span>
          <span style={{fontWeight:600}}>{dialCode}</span>
          <span style={{fontSize:10,opacity:.5}}>▾</span>
        </button>
        {open&&(
          <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,background:"#fff",border:"1.5px solid #e4e1d9",borderRadius:12,width:240,maxHeight:280,overflowY:"auto",zIndex:999,boxShadow:"0 8px 32px rgba(0,0,0,.15)"}}>
            <div style={{padding:"8px 10px",borderBottom:"1px solid #f0f0f0"}}>
              <input autoFocus placeholder="Search country…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{width:"100%",border:"1px solid #e4e1d9",borderRadius:7,padding:"6px 10px",fontSize:13,outline:"none",fontFamily:"'Inter',sans-serif"}}/>
            </div>
            {filtered.map(c=>(
              <div key={c.code} onClick={()=>{setDialCode(c.dial);setOpen(false);setSearch("");update(c.dial,num);}}
                style={{display:"flex",alignItems:"center",gap:9,padding:"9px 12px",cursor:"pointer",fontSize:13,fontWeight:dialCode===c.dial?700:400,background:dialCode===c.dial?"#f5f3ff":"transparent"}}
                onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"}
                onMouseLeave={e=>e.currentTarget.style.background=dialCode===c.dial?"#f5f3ff":"transparent"}>
                <span style={{fontSize:18}}>{c.flag}</span>
                <span style={{flex:1}}>{c.name}</span>
                <span style={{color:"#888",fontFamily:"monospace"}}>{c.dial}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Number input */}
      <input
        type="tel"
        inputMode="tel"
        placeholder="Phone number"
        value={num}
        autoComplete="tel"
        onChange={e=>{const n=e.target.value.replace(/[^\d\s\-()]/g,"");setNum(n);update(dialCode,n);}}
        style={{flex:1,padding:"11px 13px",border,borderLeft:"none",borderRadius:"0 9px 9px 0",fontSize:14,fontFamily:"'Inter',sans-serif",background:bg,color,outline:"none",...inputStyle}}
      />
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink:#e8e6ff; --ink2:#b8b5e8; --paper:#07071a; --cream:#0f0d2e; --cream2:#1a1740;
    --accent:#6366f1; --accent-h:#4f46e5; --accent-lt:rgba(99,102,241,.18);
    --green:#22c55e; --green-lt:rgba(34,197,94,.15);
    --gold:#f59e0b; --gold-lt:rgba(245,158,11,.15);
    --blue:#60a5fa; --blue-lt:rgba(96,165,250,.15);
    --purple:#a78bfa; --purple-lt:rgba(167,139,250,.15);
    --red:#f87171; --red-lt:rgba(248,113,113,.15);
    --muted:#6b6990; --border:rgba(255,255,255,.08); --card:rgba(255,255,255,.05);
    --r:12px; --rlg:20px; --rsm:8px;
    --sh:0 1px 4px rgba(0,0,0,.06);
    --shm:0 2px 12px rgba(0,0,0,.08);
    --shl:0 8px 32px rgba(0,0,0,.12);
    --shxl:0 20px 60px rgba(0,0,0,.15);
  }
  html { scroll-behavior:smooth; }
  body { font-family:'Inter',sans-serif; background:var(--paper); color:var(--ink); min-height:100vh; font-size:15px; line-height:1.6; -webkit-font-smoothing:antialiased; overflow-x:hidden; } ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:var(--paper)} ::-webkit-scrollbar-thumb{background:rgba(99,102,241,.4);border-radius:99px}


  /* Nav */
  .nav { position:sticky;top:0;z-index:200;background:rgba(7,7,26,.92);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.06);padding:0 20px;display:flex;align-items:center;justify-content:space-between;height:56px; }
  .nav-logo { font-weight:700;font-size:17px;cursor:pointer;color:#fff;display:flex;align-items:center;gap:7px;font-family:'Instrument Serif',serif; }
  .nav-dot   { width:8px;height:8px;border-radius:50%;background:var(--accent); }
  .nav-actions { display:flex;gap:8px;align-items:center; }
  .nav-actions .btn-ghost { color:rgba(255,255,255,.6);border-color:rgba(255,255,255,.15); }
  .nav-actions .btn-ghost:hover { color:#fff;border-color:rgba(255,255,255,.4); }
  .nav-actions .btn-accent { background:var(--accent);color:#fff; }

  /* Buttons */
  .btn { display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:100px;padding:9px 20px;font-size:14px;font-weight:500;cursor:pointer;border:none;transition:all .15s;font-family:'Inter',sans-serif;white-space:nowrap;line-height:1; }
  .btn:disabled { opacity:.5;cursor:not-allowed; }
  .btn-primary   { background:var(--ink);color:#fff; }
  .btn-primary:hover:not(:disabled)  { background:var(--ink2); }
  .btn-accent    { background:var(--accent);color:#fff; }
  .btn-accent:hover:not(:disabled)   { background:var(--accent-h);transform:translateY(-1px);box-shadow:0 4px 16px rgba(99,102,241,.3); }
  .btn-secondary { background:var(--card);color:var(--ink);border:1.5px solid var(--border); }
  .btn-secondary:hover:not(:disabled){ border-color:var(--ink); }
  .btn-ghost     { background:transparent;color:var(--muted);border:1.5px solid var(--border); }
  .btn-ghost:hover:not(:disabled)    { color:var(--ink);border-color:var(--ink2); }
  .btn-green  { background:var(--green);color:#fff; }
  .btn-green:hover:not(:disabled)   { filter:brightness(1.08); }
  .btn-red    { background:var(--red);color:#fff; }
  .btn-purple { background:var(--purple);color:#fff; }
  .btn-gold   { background:var(--gold);color:#fff; }
  .btn-sm  { padding:6px 14px;font-size:13px; }
  .btn-xs  { padding:4px 9px;font-size:12px;border-radius:7px; }
  .btn-lg  { padding:13px 28px;font-size:15px; }
  .btn-xl  { padding:15px 34px;font-size:16px;font-weight:600; }
  .btn-full { width:100%; }

  /* Form */
  .field { margin-bottom:15px; }
  .label { display:block;font-size:13px;font-weight:500;margin-bottom:5px;color:var(--ink2); }
  .label .opt { color:var(--muted);font-weight:400;margin-left:3px;font-size:12px; }
  .input,.textarea,.select { width:100%;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.1);border-radius:var(--rsm);padding:10px 13px;font-size:14px;color:var(--ink);font-family:'Inter',sans-serif;transition:border-color .15s,box-shadow .15s;outline:none; }
  .input:focus,.textarea:focus,.select:focus { border-color:rgba(99,102,241,.6);background:rgba(99,102,241,.08);box-shadow:0 0 0 3px rgba(99,102,241,.15); }
  .input::placeholder,.textarea::placeholder { color:var(--muted); }
  .textarea { resize:vertical;min-height:88px; }
  .select { appearance:none;cursor:pointer;padding-right:36px;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238b8880' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 13px center; }
  .field-row  { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
  .field-row3 { display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px; }
  @media(max-width:500px){ .field-row{grid-template-columns:1fr} }
  @media(max-width:600px){ .field-row3{grid-template-columns:1fr 1fr} }
  .divider { height:1px;background:var(--border);margin:20px 0; }
  .micro { font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:12px; }

  /* Cards */
  .card { background:rgba(255,255,255,.04);border:1px solid rgba(99,102,241,.15);border-radius:var(--r);box-shadow:0 2px 12px rgba(0,0,0,.3); }

  /* Badges */
  .badge { display:inline-flex;align-items:center;gap:4px;border-radius:6px;padding:3px 8px;font-size:11.5px;font-weight:500; }
  .badge-accent  { background:var(--accent-lt);color:var(--accent); }
  .badge-green   { background:var(--green-lt); color:var(--green); }
  .badge-gold    { background:var(--gold-lt);  color:var(--gold); }
  .badge-blue    { background:var(--blue-lt);  color:var(--blue); }
  .badge-purple  { background:var(--purple-lt);color:var(--purple); }
  .badge-neutral { background:var(--cream);    color:var(--muted); }
  .badge-red     { background:var(--red-lt);   color:var(--red); }
  .badge-suggest { background:#fdf4e7;color:#b45309;border:1px dashed #f59e0b; }

  /* Status badges */
  .sb { display:inline-block;border-radius:100px;padding:3px 10px;font-size:12px;font-weight:500; }
  .sb.active            { background:var(--green-lt);color:var(--green); }
  .sb.pending           { background:var(--gold-lt); color:var(--gold); }
  .sb.working           { background:var(--blue-lt); color:var(--blue); }
  .sb.payment_requested { background:var(--purple-lt);color:var(--purple); }
  .sb.paid              { background:var(--green-lt);color:var(--green); }
  .sb.rejected          { background:var(--red-lt);  color:var(--red); }
  .sb.completed         { background:var(--blue-lt); color:var(--blue); }
  .sb.suggested         { background:#fdf4e7;color:#b45309; }

  /* Toast */
  .toast { position:fixed;bottom:20px;right:20px;z-index:9999;background:var(--ink);color:#fff;border-radius:var(--r);padding:12px 18px;font-size:13.5px;box-shadow:var(--shxl);display:flex;align-items:center;gap:10px;animation:slideUp .2s ease;max-width:calc(100vw - 40px); }
  .toast.success { background:#15803d; }
  .toast.error   { background:#b91c1c; }
  @keyframes slideUp { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }

  /* Modal */
  .overlay { position:fixed;inset:0;background:rgba(10,11,13,.55);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:500;padding:16px;animation:fadeIn .15s ease; }
  @keyframes fadeIn { from{opacity:0}to{opacity:1} }
  .modal { background:#fff;color:#0a0b0d;border-radius:var(--rlg);padding:30px 26px;width:100%;max-width:480px;box-shadow:var(--shxl);animation:popUp .2s ease;max-height:calc(100vh - 32px);overflow-y:auto;position:relative; }
  @media(max-width:520px){ .modal{padding:22px 18px;border-radius:16px} }
  @keyframes popUp { from{transform:scale(.96) translateY(8px);opacity:0}to{transform:scale(1) translateY(0);opacity:1} }
  .modal-close { position:absolute;top:13px;right:13px;background:var(--cream);border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:12px;transition:all .12s; }
  .modal-close:hover { background:var(--border);color:var(--ink); }
  .modal-title { font-size:18px;font-weight:700;margin-bottom:4px; }
  .modal-sub   { font-size:13.5px;color:var(--muted);margin-bottom:20px; }

  /* Alert */
  .alert { border-radius:var(--rsm);padding:10px 13px;font-size:13.5px;margin-bottom:14px;display:flex;align-items:flex-start;gap:8px;line-height:1.5; }
  .alert-info    { background:var(--blue-lt);  color:var(--blue);  border:1px solid #bfdbfe; }
  .alert-success { background:var(--green-lt); color:var(--green); border:1px solid #bbf7d0; }
  .alert-error   { background:var(--red-lt);   color:var(--red);   border:1px solid #fca5a5; }
  .alert-gold    { background:var(--gold-lt);  color:var(--gold);  border:1px solid #fcd34d; }

  /* Empty */
  .empty { text-align:center;padding:56px 20px;color:var(--muted); }
  .empty .icon { font-size:34px;margin-bottom:10px; }
  .empty p { font-size:14.5px; }

  /* ── HERO ── */
  .hero-wrap { background:linear-gradient(135deg,#07071a 0%,#0f0d2e 100%);position:relative;overflow:hidden; }
  .hero-orb  { position:absolute;border-radius:50%;filter:blur(90px);opacity:.1;pointer-events:none; }
  .hero-inner { max-width:860px;margin:0 auto;padding:80px 24px 72px;text-align:center;position:relative;z-index:1; }
  .hero-eyebrow { display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:100px;padding:5px 14px;font-size:12px;color:rgba(255,255,255,.6);font-weight:500;margin-bottom:22px; }
  .hero-dot     { width:5px;height:5px;border-radius:50%;background:var(--accent); }
  .hero-h1      { font-family:'Instrument Serif',serif;font-size:clamp(38px,7vw,70px);font-weight:400;line-height:1.08;color:#fff;margin-bottom:18px; }
  .hero-h1 em   { font-style:italic;color:var(--accent); }
  .hero-sub     { font-size:clamp(14px,2.5vw,17px);color:rgba(255,255,255,.5);max-width:490px;margin:0 auto 34px;font-weight:300;line-height:1.7; }
  .hero-cta     { display:flex;justify-content:center;gap:10px;flex-wrap:wrap; }
  .hero-stats   { display:flex;justify-content:center;gap:36px;margin-top:48px;flex-wrap:wrap; }
  .hero-stat-n  { font-family:'Instrument Serif',serif;font-size:30px;color:#fff; }
  .hero-stat-l  { font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.07em;margin-top:2px; }

  /* ── HOW ── */
  .how-wrap  { background:#0d0b28;padding:76px 24px; }
  .how-inner { max-width:960px;margin:0 auto; }
  .sec-eye   { font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#818cf8;margin-bottom:10px; }
  .sec-title { font-family:'Instrument Serif',serif;font-size:clamp(26px,4vw,40px);font-weight:400;line-height:1.15;margin-bottom:10px; }
  .sec-sub   { font-size:15.5px;color:var(--muted);max-width:460px;font-weight:300;line-height:1.7; }
  .steps-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2px;margin-top:44px;background:var(--border);border-radius:var(--rlg);overflow:hidden; }
  .step-card  { background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.15);padding:26px 22px; }
  .step-n     { font-family:'Instrument Serif',serif;font-size:44px;color:var(--border);line-height:1;margin-bottom:12px; }
  .step-t     { font-size:15px;font-weight:600;margin-bottom:6px; }
  .step-d     { font-size:13.5px;color:var(--muted);line-height:1.65; }

  /* ── CATS ── */
  .cats-section { padding:72px 24px;background:var(--cream); }
  .cats-inner   { max-width:960px;margin:0 auto; }
  .cat-chips    { display:flex;flex-wrap:wrap;gap:8px;margin:24px 0; }
  .cat-chip { display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.05);border:1.5px solid rgba(99,102,241,.2);border-radius:100px;padding:8px 15px;font-size:13.5px;font-weight:500;cursor:pointer;transition:all .13s;user-select:none;color:var(--ink); }
  .cat-chip:hover  { border-color:var(--accent);color:var(--accent);background:var(--accent-lt); }
  .cat-chip.active { background:rgba(99,102,241,.3);color:#a5b4fc;border-color:#6366f1;font-weight:700; }
  .preview-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;margin-top:20px; }
  .prev-card { background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);border-radius:var(--r);padding:16px 18px;display:flex;justify-content:space-between;align-items:center;gap:12px;transition:box-shadow .14s,transform .14s; }
  .prev-card:hover { box-shadow:var(--shm);transform:translateY(-2px); }
  .prev-co  { font-size:15px;font-weight:600;margin-bottom:2px; }
  .prev-type{ font-size:12.5px;color:var(--muted); }
  .prev-amt { font-family:'Instrument Serif',serif;font-size:22px;color:var(--accent);white-space:nowrap; }

  /* ── PAYMENT SECTION ── */
  .pay-wrap  { background:var(--paper);padding:72px 24px; }
  .pay-inner { max-width:960px;margin:0 auto; }
  .pay-grid  { display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:40px; }
  @media(max-width:640px){ .pay-grid{grid-template-columns:1fr} }
  .pay-card  { background:var(--card);border:1px solid var(--border);border-radius:var(--rlg);padding:26px; }
  .pay-icon  { font-size:26px;margin-bottom:10px; }
  .pay-title { font-size:16px;font-weight:600;margin-bottom:10px; }
  .pay-step  { display:flex;gap:10px;font-size:13.5px;margin-bottom:9px; }
  .pay-sn    { flex-shrink:0;width:20px;height:20px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;margin-top:1px; }
  .pay-dark  { background:var(--ink);border-radius:var(--rlg);padding:28px;color:#fff;grid-column:1/-1; }
  .pay-dark-t{ font-family:'Instrument Serif',serif;font-size:22px;margin-bottom:10px; }
  .pay-nums  { display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-top:18px; }
  .pay-num   { background:rgba(255,255,255,.07);border-radius:10px;padding:14px;text-align:center; }
  .pay-num-n { font-family:'Instrument Serif',serif;font-size:28px;color:var(--accent); }
  .pay-num-l { font-size:11.5px;color:rgba(255,255,255,.4);margin-top:3px; }


  /* ── ONBOARDING ── */
  .onboard-wrap   { min-height:calc(100vh - 56px);background:linear-gradient(180deg,#07071a 0%,#0d0b28 100%); }
  .onboard-header { background:linear-gradient(135deg,#1e1b4b,#312e81);color:#fff;padding:32px 24px 28px;text-align:center; }
  .onboard-h      { font-family:'Instrument Serif',serif;font-size:26px;font-weight:400;margin-bottom:6px; }
  .onboard-p      { color:rgba(255,255,255,.38);font-size:14px; }
  .onboard-body   { max-width:640px;margin:0 auto;padding:32px 20px 60px;width:100%; }
  .ob-steps       { display:flex;align-items:center;justify-content:center;gap:0;margin-top:20px; }
  .ob-step-dot    { width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;transition:all .2s; }
  .ob-step-dot.done   { background:var(--green);color:#fff; }
  .ob-step-dot.active { background:var(--accent);color:#fff; }
  .ob-step-dot.wait   { background:rgba(255,255,255,.1);color:rgba(255,255,255,.3); }
  .ob-step-lbl        { color:rgba(255,255,255,.4);font-size:12px; }
  .ob-step-lbl.active { color:rgba(255,255,255,.85); }
  .ob-step-line   { width:40px;height:1px;background:rgba(255,255,255,.12);margin:0 6px; }
  .step-title     { font-family:'Instrument Serif',serif;font-size:22px;margin-bottom:4px; }
  .step-sub       { font-size:14px;color:var(--muted);margin-bottom:18px; }

  .ob-cats  { display:flex;flex-wrap:wrap;gap:7px;margin-bottom:18px; }
  .ob-chip  { display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.05);border:1.5px solid rgba(99,102,241,.2);border-radius:100px;padding:7px 14px;font-size:13px;font-weight:500;cursor:pointer;transition:all .13s;user-select:none;color:var(--ink); }
  .ob-chip:hover  { border-color:var(--accent);color:var(--accent); }
  .ob-chip.active { background:var(--accent);border-color:var(--accent);color:#fff; }

  .other-box   { background:rgba(99,102,241,.07);border:1.5px dashed rgba(99,102,241,.3);border-radius:var(--r);padding:16px;margin-bottom:20px; }
  .other-box-t { font-size:14px;font-weight:600;margin-bottom:4px; }
  .other-box-s { font-size:13px;color:var(--muted);margin-bottom:10px; }
  .other-tags  { display:flex;flex-wrap:wrap;gap:6px;margin-top:10px; }
  .other-tag   { display:inline-flex;align-items:center;gap:5px;background:var(--accent-lt);color:var(--accent);border-radius:100px;padding:3px 10px;font-size:12.5px; }
  .other-tag button { background:none;border:none;cursor:pointer;color:var(--accent);padding:0;font-size:12px; }

  /* bounty rows inside preview */
  .ob-prev-box  { background:rgba(255,255,255,.03);border:1.5px solid rgba(99,102,241,.2);border-radius:var(--r);overflow:hidden;margin-bottom:20px; }
  .ob-prev-hd   { padding:11px 16px;background:rgba(99,102,241,.1);border-bottom:1px solid rgba(99,102,241,.15);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);display:flex;align-items:center;justify-content:space-between; }
  .ob-b-row     { display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s; }
  .ob-b-row:last-child { border-bottom:none; }
  .ob-b-row:hover { background:rgba(99,102,241,.06); }
  .ob-b-chk     { width:20px;height:20px;border-radius:5px;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .13s;font-size:11px;font-weight:700; }
  .ob-b-chk.on  { background:var(--accent);border-color:var(--accent);color:#fff; }
  .ob-b-info    { flex:1;min-width:0; }
  .ob-b-name    { font-size:13.5px;font-weight:600; }
  .ob-b-cat     { font-size:11.5px;color:var(--muted); }
  .ob-b-amt     { display:flex;align-items:center;gap:2px;flex-shrink:0; }
  .ob-b-amt-sym { font-size:12px;color:var(--muted);margin-top:1px; }
  .ob-b-amt-inp { width:60px;border:1px solid rgba(99,102,241,.25);border-radius:6px;padding:4px 7px;font-size:13px;font-family:'Inter',sans-serif;text-align:right;background:rgba(99,102,241,.08);color:var(--ink);transition:border-color .13s; }
  .ob-b-amt-inp:focus { outline:none;border-color:var(--accent); }

  .cba { background:rgba(99,102,241,.06);border:1px solid rgba(99,102,241,.15);border-radius:var(--r);padding:14px;margin-bottom:10px; }
  .field-row3 { display:grid;grid-template-columns:1fr 1fr 100px;gap:8px; }
  @media(max-width:520px){ .field-row3{grid-template-columns:1fr 1fr} }

  .signup-card { background:rgba(255,255,255,.04);border:1px solid rgba(99,102,241,.2);border-radius:var(--rlg);padding:28px 26px;box-shadow:0 8px 32px rgba(0,0,0,.3); }
  @media(max-width:480px){ .signup-card{padding:20px 16px} }
  .pw-bar  { height:4px;border-radius:2px;background:var(--border);margin-top:6px;overflow:hidden; }
  .pw-fill { height:100%;border-radius:2px;transition:width .3s,background .3s; }

  .cf-row { display:grid;grid-template-columns:1fr 1.2fr auto;gap:8px;align-items:end;margin-bottom:7px; }
  .icon-btn { background:none;border:1.5px solid var(--border);border-radius:var(--rsm);padding:8px 10px;cursor:pointer;color:var(--muted);transition:all .12s;display:flex;align-items:center;justify-content:center;font-size:12px; }
  .icon-btn:hover { border-color:#ef4444;color:#ef4444; }
  .input-err { border-color:#ef4444 !important; background:#fff5f5; }
  .input-err:focus { box-shadow:0 0 0 3px rgba(239,68,68,.12) !important; }
  .field-err { font-size:12px;color:#ef4444;margin-top:4px;display:flex;align-items:center;gap:4px; }
  .field-err::before { content:"⚠ "; }
  @keyframes spin { to { transform:rotate(360deg); } }

  /* ── LANDING MODE PICKER ── */
  .mode-picker     { display:grid;grid-template-columns:1fr 1fr;gap:14px;max-width:580px;margin:28px auto 0; }
  .mode-card       { background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);border-radius:18px;padding:24px 20px;cursor:pointer;transition:all .18s;text-align:left; }
  .mode-card:hover { background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.3);transform:translateY(-2px); }
  .mode-card.accent { background:var(--accent);border-color:var(--accent); }
  .mode-card.accent:hover { background:var(--accent-h);border-color:var(--accent-h); }
  .mode-icon       { font-size:28px;margin-bottom:10px; }
  .mode-title      { font-size:16px;font-weight:700;color:#fff;margin-bottom:4px; }
  .mode-desc       { font-size:12.5px;color:rgba(255,255,255,.55);line-height:1.55; }
  .mode-card.accent .mode-desc { color:rgba(255,255,255,.75); }
  @media(max-width:520px){ .mode-picker{grid-template-columns:1fr} }

  /* ── CREATOR ONBOARDING ── */
  .cr-wrap    { min-height:calc(100vh - 56px);background:var(--paper); }
  .cr-header  { background:linear-gradient(135deg,#1a1045,#2d1b69);color:#fff;padding:32px 24px 28px;text-align:center; }
  .cr-h       { font-family:'Instrument Serif',serif;font-size:26px;color:#fff;margin-bottom:6px; }
  .cr-p       { font-size:14px;color:rgba(255,255,255,.45); }
  .cr-body    { max-width:620px;margin:0 auto;padding:32px 20px 80px; }
  .cr-steps   { display:flex;align-items:center;justify-content:center;gap:0;margin-top:20px; }

  .cr-type-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:20px 0; }
  .cr-type-card { border:2px solid var(--border);border-radius:14px;padding:18px 14px;cursor:pointer;text-align:center;transition:all .15s;background:var(--card); }
  .cr-type-card:hover { border-color:var(--accent);background:var(--accent-lt); }
  .cr-type-card.on { border-color:var(--accent);background:var(--accent-lt); }
  .cr-type-icon { font-size:30px;margin-bottom:8px; }
  .cr-type-name { font-size:14px;font-weight:700;margin-bottom:3px; }
  .cr-type-desc { font-size:11.5px;color:var(--muted);line-height:1.5; }
  @media(max-width:500px){ .cr-type-grid{grid-template-columns:1fr} }

  .cr-avatar-row { display:flex;align-items:center;gap:16px;margin-bottom:20px; }
  .cr-avatar-prev { width:72px;height:72px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;flex-shrink:0;overflow:hidden;border:3px solid var(--border); }
  .cr-avatar-prev img { width:100%;height:100%;object-fit:cover; }

  .cr-service   { background:var(--card);border:1.5px solid var(--border);border-radius:14px;padding:18px 20px;margin-bottom:12px;transition:border-color .14s; }
  .cr-service.on { border-color:var(--accent); }
  .cr-svc-hd   { display:flex;align-items:center;gap:10px;margin-bottom:0;cursor:pointer; }
  .cr-svc-chk  { width:20px;height:20px;border-radius:6px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;transition:all .13s; }
  .cr-svc-chk.on { background:var(--accent);border-color:var(--accent);color:#fff; }
  .cr-svc-name { font-size:14px;font-weight:700;flex:1; }
  .cr-svc-desc { font-size:12px;color:var(--muted);margin-top:1px; }
  .cr-svc-body { margin-top:14px;padding-top:14px;border-top:1px solid var(--border); }
  .cr-price-row { display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap; }
  .cr-price-label { font-size:13px;font-weight:500;flex:1;min-width:120px; }
  .cr-price-inp { width:100px;padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;font-weight:600;font-family:'Inter',sans-serif;text-align:right; }
  .cr-price-inp:focus { outline:none;border-color:var(--accent); }
  .cr-toggle-row { display:flex;align-items:center;gap:8px;margin-top:8px;padding:8px 10px;background:var(--cream);border-radius:8px; }
  .cr-toggle    { width:36px;height:20px;border-radius:100px;background:var(--border);position:relative;cursor:pointer;transition:background .15s;flex-shrink:0; }
  .cr-toggle.on { background:var(--accent); }
  .cr-toggle-dot{ width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:left .15s;box-shadow:0 1px 3px rgba(0,0,0,.2); }
  .cr-toggle.on .cr-toggle-dot { left:18px; }
  .cr-toggle-label { font-size:12px;color:var(--muted);flex:1;line-height:1.4; }

  /* Share popup */
  .share-popup-overlay { position:fixed;inset:0;background:rgba(10,11,13,.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:600;padding:20px; }
  .share-popup  { background:var(--card);border-radius:24px;padding:36px 32px;max-width:480px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.2);animation:popUp .2s ease; }
  .share-popup-icon { font-size:52px;margin-bottom:14px; }
  .share-popup-title { font-family:'Instrument Serif',serif;font-size:28px;margin-bottom:8px; }
  .share-popup-sub { font-size:14.5px;color:var(--muted);margin-bottom:24px;line-height:1.6; }
  .share-popup-url  { background:var(--cream);border:1.5px solid var(--border);border-radius:10px;padding:11px 16px;font-family:monospace;font-size:13px;margin-bottom:18px;word-break:break-all;text-align:left; }
  .share-popup-nets { display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px; }
  .share-popup-net  { display:flex;align-items:center;gap:8px;padding:11px 14px;border:1.5px solid rgba(99,102,241,.25);border-radius:100px;cursor:pointer;font-size:13.5px;font-weight:600;transition:all .13s;background:rgba(99,102,241,.1);text-decoration:none;color:var(--ink); }
  .share-popup-net:hover { transform:translateY(-1px);box-shadow:0 3px 10px rgba(0,0,0,.1); }
  .site-footer       { background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:52px 24px 28px; }
  .site-footer-inner { max-width:760px;margin:0 auto; }
  .ft-divider        { border:none;border-top:1px solid rgba(0,0,0,.1);margin:32px 0 20px; }
  .ft-bottom         { display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px; }
  .ft-copy           { font-size:11.5px;color:rgba(0,0,0,.35); }

  /* ── FOOTER FUNNEL ── */
  .ft-funnel-hd    { text-align:center;margin-bottom:28px; }
  .ft-funnel-eyebrow { display:inline-block;background:rgba(0,0,0,.12);border-radius:100px;padding:5px 14px;font-size:12px;color:rgba(0,0,0,.7);font-weight:700;margin-bottom:12px;letter-spacing:.04em; }
  .ft-funnel-title { font-family:'Instrument Serif',serif;font-size:clamp(26px,4vw,42px);color:#fff;margin-bottom:8px;line-height:1.1; }
  .ft-funnel-sub   { font-size:14px;color:rgba(255,255,255,.7); }
  .ft-funnel-body  { max-width:760px;margin:0 auto; }

  /* Step panels */
  .ft-panel        { background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.25);border-radius:16px;padding:22px;margin-bottom:16px;backdrop-filter:blur(4px); }
  .ft-panel-hd     { display:flex;align-items:center;gap:10px;margin-bottom:16px; }
  .ft-panel-num    { width:26px;height:26px;border-radius:50%;background:#fff;color:var(--accent);font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
  .ft-panel-title  { font-size:14px;font-weight:700;color:#fff; }
  .ft-panel-sub    { font-size:12px;color:rgba(255,255,255,.65);margin-left:auto; }

  .ft-chips        { display:flex;flex-wrap:wrap;gap:6px; }
  .ft-chip         { display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.25);border-radius:100px;padding:6px 13px;font-size:12.5px;color:rgba(255,255,255,.85);cursor:pointer;transition:all .13s;user-select:none; }
  .ft-chip:hover   { background:rgba(255,255,255,.25);border-color:#fff; }
  .ft-chip.on      { background:#fff;border-color:#fff;color:var(--accent);font-weight:600; }

  .ft-bounties     { background:rgba(255,255,255,.1);border-radius:10px;overflow:hidden; }
  .ft-b-row        { display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.08);cursor:pointer;transition:background .12s; }
  .ft-b-row:last-child { border-bottom:none; }
  .ft-b-row:hover  { background:rgba(255,255,255,.08); }
  .ft-b-row.on     { background:rgba(255,255,255,.15); }
  .ft-b-chk        { width:18px;height:18px;border-radius:5px;border:1.5px solid rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;font-weight:700;transition:all .13s;color:#fff; }
  .ft-b-chk.on     { background:#fff;border-color:#fff;color:var(--accent); }
  .ft-b-info       { flex:1;min-width:0; }
  .ft-b-name       { font-size:13px;font-weight:600;color:#fff; }
  .ft-b-cat        { font-size:11.5px;color:rgba(255,255,255,.55); }
  .ft-b-amt        { display:flex;align-items:center;gap:2px;flex-shrink:0; }
  .ft-amt-inp      { width:55px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:6px;padding:4px 6px;font-size:12px;color:#fff;font-family:'Inter',sans-serif;text-align:right; }
  .ft-amt-inp:focus{ outline:none;border-color:#fff; }
  .ft-add-btn      { width:100%;padding:10px;background:none;border:none;color:rgba(255,255,255,.5);font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;transition:color .13s; }
  .ft-add-btn:hover{ color:#fff; }
  .ft-add-form     { padding:14px;border-top:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05); }

  .ft-form-grid    { display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px; }
  .ft-label        { font-size:11px;color:rgba(255,255,255,.65);margin-bottom:4px;font-weight:600; }
  .ft-input        { width:100%;background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.25);border-radius:8px;padding:10px 12px;font-size:13.5px;color:#fff;font-family:'Inter',sans-serif;outline:none;transition:border-color .13s; }
  .ft-input::placeholder { color:rgba(255,255,255,.4); }
  .ft-input:focus  { border-color:#fff;background:rgba(255,255,255,.2); }
  .ft-input-err    { border-color:rgba(0,0,0,.4) !important;background:rgba(0,0,0,.08) !important; }
  .ft-select       { width:100%;background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.25);border-radius:8px;padding:10px 12px;font-size:13px;color:#fff;font-family:'Inter',sans-serif;outline:none; }
  .ft-select option{ background:#4338ca;color:#fff; }
  .ft-field-err    { font-size:11px;color:rgba(0,0,0,.6);margin-top:3px;font-weight:600; }
  .ft-err-banner   { background:rgba(0,0,0,.15);border-radius:8px;padding:9px 13px;font-size:12.5px;color:#fff;margin-bottom:12px; }
  .ft-cta-btn      { width:100%;padding:16px;background:#fff;color:var(--accent);border:none;border-radius:100px;font-size:16px;font-weight:800;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;letter-spacing:-.01em; }
  .ft-cta-btn:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,.2); }
  .ft-cta-btn:disabled { opacity:.5;cursor:not-allowed; }
  .ft-btn-ghost    { padding:8px 16px;background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.3);border-radius:8px;color:#fff;font-size:12.5px;cursor:pointer;font-family:'Inter',sans-serif; }
  .ft-btn-accent   { padding:8px 16px;background:#fff;border:none;border-radius:8px;color:var(--accent);font-size:12.5px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif; }
  .ft-btn-accent:disabled { opacity:.5;cursor:not-allowed; }
  @media(max-width:560px){ .ft-form-grid{grid-template-columns:1fr} }

  /* share panel */
  .share-bar       { background:rgba(99,102,241,.12);border:1.5px solid rgba(99,102,241,.3);border-radius:16px;padding:20px 22px;margin-top:18px;display:flex;align-items:center;gap:16px;flex-wrap:wrap; }
  .share-url-box   { flex:1;min-width:200px;background:rgba(99,102,241,.08);border:1.5px solid rgba(99,102,241,.2);border-radius:10px;padding:10px 14px;font-size:13px;font-family:monospace;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
  .share-copy-btn  { background:var(--accent);color:#fff;border:none;border-radius:100px;padding:11px 22px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;white-space:nowrap;transition:all .14s;flex-shrink:0; }
  .share-copy-btn:hover { background:var(--accent-h);transform:translateY(-1px);box-shadow:0 4px 14px rgba(99,102,241,.35); }
  .share-copy-btn.copied { background:var(--green); }
  .share-networks  { display:flex;gap:8px;flex-wrap:wrap;margin-top:12px; }
  .share-net-btn   { display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:100px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid rgba(99,102,241,.2);background:rgba(99,102,241,.08);color:var(--ink);transition:all .13s;font-family:'Inter',sans-serif; }
  .share-net-btn:hover { transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,.1); }

  .profile-wrap  { min-height:calc(100vh - 56px);background:var(--paper); }
  .profile-hero  { background:linear-gradient(135deg,#1e1b4b,#312e81);color:#fff;padding:40px 22px 36px; }
  .p-inner       { max-width:900px;margin:0 auto; }
  .p-top  { display:flex;align-items:flex-start;gap:18px;flex-wrap:wrap; }
  .p-av   { width:58px;height:58px;border-radius:50%;background:var(--accent);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff; }
  .p-name { font-family:'Instrument Serif',serif;font-size:26px;font-weight:400;margin-bottom:2px; }
  .p-hand { font-size:13px;color:rgba(255,255,255,.35);margin-bottom:10px; }
  .p-tags { display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px; }
  .p-tag  { background:rgba(255,255,255,.08);border-radius:5px;padding:3px 9px;font-size:12px;color:rgba(255,255,255,.6); }
  .p-links{ display:flex;gap:12px;flex-wrap:wrap; }
  .p-links a,.p-links span { font-size:13px;color:rgba(255,255,255,.45);text-decoration:none;display:flex;align-items:center;gap:5px; }
  .p-links a:hover { color:#fff; }
  .p-cust { margin-top:12px;display:flex;flex-direction:column;gap:5px; }
  .p-cr   { display:flex;gap:10px;font-size:13px; }
  .p-ck   { min-width:100px;color:rgba(255,255,255,.35);font-weight:500; }
  .p-cv   { color:rgba(255,255,255,.72); }
  .copy-btn { display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:7px;padding:5px 11px;color:rgba(255,255,255,.5);font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;transition:all .12s;margin-top:14px; }
  .copy-btn:hover { background:rgba(255,255,255,.13);color:#fff; }

  .b-area  { max-width:900px;margin:0 auto;padding:26px 20px 56px; }
  .ba-head { display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px; }
  .ba-ttl  { font-size:16px;font-weight:700;display:flex;align-items:center;gap:7px; }
  .b-cnt   { background:var(--cream);border-radius:100px;padding:2px 8px;font-size:12px;color:var(--muted);font-weight:500; }

  .b-card  { background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:17px 18px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;transition:box-shadow .14s,transform .14s;margin-bottom:9px; }
  .b-card:hover  { box-shadow:var(--shm);transform:translateY(-2px); }
  .b-card.suggest{ border-style:dashed;border-color:#f59e0b;background:#fffdf5; }
  .b-left  { flex:1;min-width:0; }
  .b-co    { font-size:15px;font-weight:600;margin-bottom:3px; }
  .b-desc  { font-size:13px;color:var(--muted);margin-top:3px;line-height:1.5; }
  .b-right { display:flex;flex-direction:column;align-items:flex-end;gap:9px;flex-shrink:0; }
  .b-amt   { font-family:'Instrument Serif',serif;font-size:24px;color:var(--accent);white-space:nowrap; }

  .add-b-form { background:var(--cream);border:1px solid var(--border);border-radius:var(--r);padding:18px;margin-bottom:18px; }
  .add-b-grid { display:grid;grid-template-columns:1.2fr 1.6fr 90px auto;gap:9px;align-items:end; }
  @media(max-width:560px){ .add-b-grid{grid-template-columns:1fr 1fr} }

  .suggest-bar { text-align:center;padding:32px 20px;border-top:1px solid var(--border);margin-top:18px; }
  .suggest-bar p { font-size:14px;color:var(--muted);margin-bottom:12px; }

  /* ── PROFILE PAGE TYPE BADGE ── */
  .page-type-badge { display:inline-flex;align-items:center;gap:6px;border-radius:100px;padding:4px 12px;font-size:11.5px;font-weight:700;letter-spacing:.04em;margin-bottom:10px; }
  .page-type-bounty  { background:rgba(99,102,241,.15);color:#a5b4fc; }
  .page-type-creator { background:rgba(99,102,241,.2);color:#a5b4fc; }

  /* ── CREATOR PROFILE VIEW ── */
  .cr-profile-wrap { background:var(--paper);min-height:calc(100vh - 56px); }
  .cr-profile-hero { background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);color:#fff;padding:44px 22px 40px; }
  .cr-p-inner      { max-width:860px;margin:0 auto; }
  .cr-p-top        { display:flex;align-items:flex-start;gap:22px;flex-wrap:wrap; }
  .cr-p-av         { width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fff;border:3px solid rgba(255,255,255,.2);overflow:hidden; }
  .cr-p-name       { font-family:'Instrument Serif',serif;font-size:30px;font-weight:400;margin-bottom:4px; }
  .cr-p-handle     { font-size:13px;color:rgba(255,255,255,.4);margin-bottom:12px; }
  .cr-p-tags       { display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px; }
  .cr-p-tag        { background:rgba(255,255,255,.1);border-radius:6px;padding:4px 10px;font-size:12px;color:rgba(255,255,255,.65); }
  .cr-p-bio        { font-size:14px;color:rgba(255,255,255,.55);line-height:1.6;max-width:440px; }

  .cr-services-area { max-width:860px;margin:0 auto;padding:32px 20px 60px;background:var(--paper); }
  .cr-cat-section   { margin-bottom:36px; }
  .cr-cat-hd        { display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid var(--border); }
  .cr-cat-icon      { font-size:22px; }
  .cr-cat-label     { font-size:18px;font-weight:700; }
  .cr-cat-count     { background:var(--cream);border-radius:100px;padding:2px 9px;font-size:12px;color:var(--muted);font-weight:500; }
  .cr-svc-grid      { display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px; }
  .cr-svc-card      { background:rgba(255,255,255,.04);border:1.5px solid rgba(99,102,241,.15);border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:10px;transition:all .15s; }
  .cr-svc-card:hover{ box-shadow:0 4px 24px rgba(99,102,241,.25);transform:translateY(-2px);border-color:rgba(99,102,241,.5); }
  .cr-svc-card-name { font-size:14.5px;font-weight:700; }
  .cr-svc-card-desc { font-size:12.5px;color:var(--muted);line-height:1.5;flex:1; }
  .cr-svc-footer    { display:flex;align-items:center;justify-content:space-between;margin-top:4px; }
  .cr-svc-price     { font-family:'Instrument Serif',serif;font-size:22px;color:var(--accent); }
  .cr-svc-price-hidden { font-size:12px;color:var(--muted);font-style:italic; }
  .cr-buy-btn       { background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:100px;padding:10px 20px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all .14s;white-space:nowrap;box-shadow:0 2px 12px rgba(99,102,241,.35); }
  .cr-buy-btn:hover { transform:translateY(-2px);box-shadow:0 6px 20px rgba(99,102,241,.5); }

  /* ── PAY MODAL ── */
  .pay-overlay { position:fixed;inset:0;background:rgba(5,5,18,.8);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;animation:fadeIn .15s ease; }
  .pay-modal   { background:#0f0d2e;border:1px solid rgba(165,180,252,.15);border-radius:20px;padding:32px 28px;width:100%;max-width:420px;box-shadow:0 24px 80px rgba(0,0,0,.6);animation:popUp .2s ease;position:relative;max-height:calc(100vh - 40px);overflow-y:auto; }
  .pay-close   { position:absolute;top:14px;right:14px;background:rgba(255,255,255,.08);border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.6);font-size:14px;font-weight:700; }
  .pay-close:hover { background:rgba(239,68,68,.2);color:#f87171; }
  .pay-field   { width:100%;padding:11px 13px;border:1.5px solid rgba(255,255,255,.12);border-radius:9px;font-size:14px;font-family:'Inter',sans-serif;margin-bottom:10px;background:rgba(255,255,255,.06);color:#e8e6ff;outline:none;transition:border-color .13s; }
  .pay-field::placeholder { color:rgba(255,255,255,.25); }
  .pay-field:focus { border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.2); }
  .pay-submit  { width:100%;padding:14px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border:none;border-radius:100px;font-size:15px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;margin-top:4px; }
  .pay-submit:hover { transform:translateY(-1px);box-shadow:0 4px 20px rgba(99,102,241,.5); }
  .pay-submit:disabled { opacity:.4;cursor:not-allowed;transform:none; }

  /* ── DASHBOARD ── */
  .dash-hero  { background:linear-gradient(135deg,#1e1b4b,#2d2466);padding:34px 22px 28px; }
  .dash-inner { max-width:960px;margin:0 auto; }
  .dash-wrap  { max-width:960px;margin:0 auto;padding:28px 20px 56px; }
  .dash-greet { font-family:'Instrument Serif',serif;font-size:24px;color:#fff; }
  .dash-acts  { display:flex;gap:8px;flex-wrap:wrap;margin-top:14px; }
  .dash-tabs  { display:flex;gap:2px;flex-wrap:wrap;border-bottom:2px solid var(--border);margin-bottom:22px; }
  .d-tab { padding:9px 15px;font-size:13.5px;font-weight:500;cursor:pointer;border:none;background:none;color:var(--muted);font-family:'Inter',sans-serif;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all .14s;display:flex;align-items:center;gap:5px; }
  .d-tab:hover  { color:var(--ink); }
  .d-tab.active { color:var(--ink);border-bottom-color:var(--ink); }
  .d-tab .cnt { background:var(--cream);color:var(--muted);border-radius:100px;padding:1px 6px;font-size:11px; }
  .d-tab.active .cnt { background:var(--accent);color:#fff; }

  .tbl-wrap { background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;overflow-x:auto; }
  .tbl { width:100%;border-collapse:collapse;min-width:460px; }
  .tbl th { background:var(--cream);padding:10px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border);white-space:nowrap; }
  .tbl td { padding:12px 14px;font-size:13.5px;border-bottom:1px solid var(--border);vertical-align:middle; }
  .tbl tr:last-child td { border-bottom:none; }
  .tbl tr:hover td { background:var(--paper); }

  /* ── ADMIN ── */
  .admin-wrap  { min-height:calc(100vh - 56px);background:var(--paper); }
  .admin-hero  { background:linear-gradient(135deg,#0a0b0d 0%,#1a1b20 100%);color:#fff;padding:36px 22px 30px; }
  .admin-inner { max-width:1100px;margin:0 auto; }
  .admin-badge { display:inline-flex;align-items:center;gap:6px;background:rgba(124,58,237,.2);border:1px solid rgba(124,58,237,.3);border-radius:100px;padding:4px 12px;font-size:12px;color:#a78bfa;font-weight:600;margin-bottom:14px; }
  .admin-title { font-family:'Instrument Serif',serif;font-size:28px;font-weight:400; }
  .admin-stats-row { display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:22px; }
  .admin-stat  { background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:16px 18px; }
  .admin-stat-n{ font-family:'Instrument Serif',serif;font-size:28px;color:#fff; }
  .admin-stat-l{ font-size:12px;color:rgba(255,255,255,.4);margin-top:2px; }
  .admin-body  { max-width:1100px;margin:0 auto;padding:28px 20px 60px; }
  .admin-tabs  { display:flex;gap:2px;flex-wrap:wrap;border-bottom:2px solid var(--border);margin-bottom:22px; }

  .url-card { background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px;flex-wrap:wrap; }
  .url-name { font-size:15px;font-weight:600; }
  .url-link { font-size:12.5px;color:var(--accent);font-family:monospace; }
  .url-meta { font-size:12.5px;color:var(--muted); }

  /* Sign in */
  .signin-wrap { min-height:calc(100vh - 56px);display:flex;align-items:center;justify-content:center;padding:24px; }
  .signin-card { background:var(--card);border:1px solid var(--border);border-radius:var(--rlg);padding:32px;width:100%;max-width:390px;box-shadow:var(--shm); }

  /* CTA footer */
  .cta-ft    { background:linear-gradient(135deg,#07071a,#1e1b4b);padding:68px 24px;text-align:center; }
  .cta-ttl   { font-family:'Instrument Serif',serif;font-size:clamp(26px,5vw,46px);color:#fff;line-height:1.15;margin-bottom:12px; }
  .cta-sub   { font-size:15px;color:rgba(255,255,255,.38);margin-bottom:28px;font-weight:300; }
  .cta-btns  { display:flex;gap:10px;justify-content:center;flex-wrap:wrap; }

  @media(max-width:700px){
    .hero-inner{padding:60px 20px 56px}
    .how-wrap,.pay-wrap,.cats-section{padding:56px 20px}
    .p-top{flex-direction:column}
    .profile-hero{padding:28px 16px 24px}
    .b-area{padding:18px 16px 48px}
    .dash-wrap,.admin-body{padding:20px 16px 48px}
    .add-b-grid{grid-template-columns:1fr 1fr}
    .hero-stats{gap:22px}
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {id:"job_referral",label:"Job Referral",icon:"💼"},
  {id:"investor_intro",label:"Investor Intro",icon:"💰"},
  {id:"founder_intro",label:"Founder Intro",icon:"🚀"},
  {id:"podcast_guest",label:"Podcast Guest",icon:"🎙️"},
  {id:"hiring_help",label:"Hiring Help",icon:"🔍"},
  {id:"sales_lead",label:"Sales Lead",icon:"📈"},
  {id:"pr_intro",label:"PR / Media Intro",icon:"📰"},
  {id:"influencer",label:"Influencer Collab",icon:"⭐"},
  {id:"partnership",label:"Partnership",icon:"🤝"},
  {id:"advisor",label:"Advisor",icon:"🎓"},
  {id:"mentor",label:"Mentor",icon:"🧠"},
  {id:"beta_users",label:"Beta Users",icon:"🧪"},
  {id:"design_help",label:"Design Help",icon:"🎨"},
  {id:"product_feedback",label:"Product Feedback",icon:"💬"},
  {id:"distribution",label:"Distribution",icon:"📦"},
  {id:"co_founder",label:"Co-founder",icon:"👥"},
  {id:"customer_intro",label:"Customer Intro",icon:"🛒"},
  {id:"freelancer",label:"Freelancer",icon:"💻"},
  {id:"event_invite",label:"Event Invite",icon:"🎟️"},
  {id:"legal_advice",label:"Legal Advice",icon:"⚖️"},
  {id:"marketing",label:"Marketing Help",icon:"📣"},
  {id:"engineering",label:"Engineering Help",icon:"🔧"},
  {id:"fundraising",label:"Fundraising Help",icon:"🏦"},
  {id:"content",label:"Content Creation",icon:"✍️"},
  {id:"talent",label:"Talent Referral",icon:"🌟"},
  {id:"research",label:"Research Help",icon:"🔬"},
  {id:"visa_sponsor",label:"Visa Sponsor",icon:"🌍"},
  {id:"office_space",label:"Office Space",icon:"🏢"},
  {id:"accounting",label:"Accounting",icon:"🧮"},
];
const CAT = Object.fromEntries(CATEGORIES.map(c=>[c.id,c]));

const DEFAULTS = {
  job_referral:[{company:"Google",description:"SWE L4/L5 referral",amount:100},{company:"Meta",description:"Product Manager referral",amount:100},{company:"Apple",description:"Any engineering role",amount:80},{company:"Stripe",description:"Backend engineer referral",amount:120},{company:"Airbnb",description:"Design / PM referral",amount:90}],
  investor_intro:[{company:"Sequoia",description:"Seed / Series A intro",amount:250},{company:"a16z",description:"AI / software focus",amount:300},{company:"YC Alumni",description:"Angel investor intro",amount:150},{company:"Benchmark",description:"Series A intro",amount:200}],
  founder_intro:[{company:"YC Batch",description:"Intro to YC founder",amount:100},{company:"Fintech",description:"B2B SaaS founder intro",amount:80},{company:"AI Startup",description:"AI startup founder intro",amount:120}],
  hiring_help:[{company:"Any",description:"Senior fullstack engineer",amount:200},{company:"Any",description:"Product designer (senior)",amount:150},{company:"Any",description:"Head of Growth",amount:180}],
  sales_lead:[{company:"Enterprise",description:"Intro to VP Eng/CTO",amount:200},{company:"SMB",description:"Decision-maker intro",amount:80}],
  pr_intro:[{company:"TechCrunch",description:"Reporter introduction",amount:150},{company:"Forbes",description:"Contributor intro",amount:120},{company:"The Verge",description:"Press coverage intro",amount:100}],
  mentor:[{company:"Any",description:"Startup growth mentor",amount:60},{company:"Any",description:"Technical / CTO mentor",amount:80}],
  advisor:[{company:"Any",description:"GTM / revenue advisor",amount:100},{company:"Any",description:"Technical advisor (AI/ML)",amount:120}],
  beta_users:[{company:"Any",description:"10 engaged beta testers",amount:50},{company:"Any",description:"Power user community intro",amount:70}],
  podcast_guest:[{company:"Any",description:"Podcast 10k+ listeners",amount:100},{company:"Any",description:"Tech / startup podcast",amount:80}],
  influencer:[{company:"Twitter/X",description:"Tech influencer 50k+",amount:150},{company:"LinkedIn",description:"B2B influencer collab",amount:100}],
  partnership:[{company:"Any SaaS",description:"Integration partnership",amount:120},{company:"Any",description:"Distribution partnership",amount:150}],
  design_help:[{company:"Any",description:"UI/UX audit + feedback",amount:80},{company:"Any",description:"Brand identity designer",amount:100}],
  product_feedback:[{company:"Any",description:"30-min product review call",amount:30},{company:"Any",description:"Detailed written feedback",amount:40}],
  co_founder:[{company:"Any",description:"Technical co-founder intro",amount:200},{company:"Any",description:"Business co-founder intro",amount:200}],
  customer_intro:[{company:"Enterprise",description:"F500 buyer intro",amount:250},{company:"SMB",description:"SMB decision-maker intro",amount:100}],
};

const PAYMENT_METHODS = ["PayPal","Venmo","Cash App","Zelle","Wise","Bank Transfer","Revolut","Crypto"];

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
function Toast({msg,type,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,3500);return()=>clearTimeout(t);},[]);
  return <div className={`toast ${type}`}><span>{type==="success"?"✓":"✕"}</span>{msg}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCEPT MODAL — helper applies for a bounty
// ─────────────────────────────────────────────────────────────────────────────
function AcceptModal({bounty,onClose,onSubmit}){
  const [form,setForm]=useState({email:"",message:"",proof:""});
  const [errs,setErrs]=useState({});
  const [loading,setLoading]=useState(false);
  const set=(k,v)=>{setForm(f=>({...f,[k]:v}));if(errs[k]) setErrs(e=>({...e,[k]:""}));};
  const cat=CAT[bounty.category];
  const validate=()=>{
    const e={};
    if(!form.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email="Enter a valid email";
    return e;
  };
  const submit=async()=>{
    const e=validate();setErrs(e);
    if(Object.keys(e).length>0) return;
    setLoading(true);await onSubmit({...form,name:"anonymous"});setLoading(false);
  };
  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">I can fulfill this 🎯</div>
        <div className="modal-sub">
          <span className="badge badge-accent" style={{marginRight:6}}>{cat?.icon} {cat?.label||bounty.category}</span>
          <strong>{bounty.company}</strong> &nbsp;·&nbsp; <strong style={{color:"var(--accent)"}}>${bounty.amount}</strong>
        </div>
        <div className="alert alert-gold">
          💳 <strong>How you get paid:</strong> Submit → owner reviews → if accepted you do the work → submit payment claim → we verify → you receive <strong>${bounty.amount}</strong> via your preferred method.
        </div>
        <div className="field"><label className="label">Phone Number <span className="opt">(private — for account access)</span></label><PhoneInput value={form.phone||""} onChange={v=>set("phone",v)} style={{width:"100%"}}/>{errs.phone&&<div className="field-err">{errs.phone}</div>}</div>
        <div className="field"><label className="label">How can you help? <span className="opt">(optional)</span></label><textarea className="textarea" placeholder="Describe your connection or how you'll deliver this…" value={form.message} onChange={e=>set("message",e.target.value)}/></div>
        <div className="field"><label className="label">Proof / Link <span className="opt">(optional)</span></label><input className="input" placeholder="LinkedIn, portfolio, mutual connection proof…" value={form.proof} onChange={e=>set("proof",e.target.value)}/></div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent btn-full" onClick={submit} disabled={loading}>{loading?"Submitting…":"Submit Application"}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PAID MODAL — helper claims payment after doing the work
// ─────────────────────────────────────────────────────────────────────────────
function GetPaidModal({acceptance,onClose,onSubmit}){
  const [confirmed,setConfirmed]=useState(false);
  const [form,setForm]=useState({paymentMethod:"",paymentHandle:"",completionNote:""});
  const [loading,setLoading]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=async()=>{
    if(!form.paymentMethod||!form.paymentHandle) return;
    setLoading(true);await onSubmit(form);setLoading(false);
  };
  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">Claim Your Payment 💸</div>
        <div className="modal-sub">Submit proof of completion and your payment details.</div>

        {!confirmed?(
          <>
            <div style={{background:"rgba(99,102,241,.07)",borderRadius:"var(--r)",padding:20,marginBottom:20,textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:10}}>✅</div>
              <div style={{fontFamily:"Instrument Serif",fontSize:18,marginBottom:8}}>Have you completed the task?</div>
              <div style={{fontSize:13.5,color:"var(--muted)",marginBottom:18,lineHeight:1.6}}>
                Only claim payment once you've actually made the introduction, referral, or connection happen. The page owner will verify before approving.
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                <button className="btn btn-ghost btn-sm" onClick={onClose}>Not yet</button>
                <button className="btn btn-green" onClick={()=>setConfirmed(true)}>Yes, I completed it ✓</button>
              </div>
            </div>
          </>
        ):(
          <>
            <div className="alert alert-success">✓ Great! Fill in your payment details below and we'll process it within 24h after verification.</div>
            <div className="field">
              <label className="label">What did you do?</label>
              <textarea className="textarea" placeholder="Describe what introduction/referral/work you completed…" value={form.completionNote} onChange={e=>set("completionNote",e.target.value)}/>
            </div>
            <div className="field-row">
              <div className="field">
                <label className="label">Payment Method</label>
                <select className="select" value={form.paymentMethod} onChange={e=>set("paymentMethod",e.target.value)}>
                  <option value="">Select…</option>
                  {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Your Handle / Address</label>
                <input className="input" placeholder="@username or email" value={form.paymentHandle} onChange={e=>set("paymentHandle",e.target.value)}/>
              </div>
            </div>
            <div className="alert alert-gold" style={{marginTop:4}}>
              🔍 Your claim will be reviewed. Once verified, payment is sent directly to your {form.paymentMethod||"chosen method"}.
            </div>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
              <button className="btn btn-green btn-full" onClick={submit} disabled={loading||!form.paymentMethod||!form.paymentHandle}>
                {loading?"Submitting…":"Submit Payment Claim →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUGGEST MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SuggestModal({onClose,onSubmit}){
  const [form,setForm]=useState({company:"",category:"",amount:"",description:""});
  const [loading,setLoading]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=async()=>{
    if(!form.company||!form.category||!form.amount) return;
    setLoading(true);await onSubmit(form);setLoading(false);
  };
  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">Suggest a Bounty 💡</div>
        <div className="modal-sub">Propose a bounty and get paid if accepted.</div>
        <div className="field"><label className="label">Company / Target</label><input className="input" placeholder="e.g. Stripe" value={form.company} onChange={e=>set("company",e.target.value)}/></div>
        <div className="field-row">
          <div className="field"><label className="label">Type</label>
            <select className="select" value={form.category} onChange={e=>set("category",e.target.value)}>
              <option value="">Select…</option>
              {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div className="field"><label className="label">Your Ask ($)</label><input className="input" type="number" placeholder="70" value={form.amount} onChange={e=>set("amount",e.target.value)}/></div>
        </div>
        <div className="field"><label className="label">Description <span className="opt">(opt)</span></label><textarea className="textarea" placeholder="Describe what you can deliver…" value={form.description} onChange={e=>set("description",e.target.value)}/></div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-full" onClick={submit} disabled={loading||!form.company||!form.category||!form.amount}>{loading?"Submitting…":"Suggest Bounty"}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC PROFILE PAGE
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PAY MODAL — Stripe checkout for creator services
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// PAY MODAL — brand verification + Stripe checkout
// ─────────────────────────────────────────────────────────────────────────────
const STRIPE_PK = "pk_live_51KLZlpDW3FwkTm7hlBeiuq9CrbzprsKJ6japvWBhrcaJvY7i4jhzBFvPj1bCOJmYX5mpQDU3FXL2jB8zR1TphQkZ00sCZhaEsZ";
const STRIPE_SK = "Bearer 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";
const PAY_ENDPOINT = "https://redisne-4521a3f9410f.herokuapp.com/pay";
const SMS_ENDPOINT = "https://datingggo-d609631f502c.herokuapp.com/send-sms";

function PayModal({service, profileUsername, onClose}){
  const isSelfPayment = service._selfPayment === true;
  const brandsOnly = service.description?.includes("[brands-only]");
  const cleanDesc  = service.description?.replace(" [brands-only]","");
  const price      = Number(service.amount)||0;

  // step: "info" | "otp" | "pay" | "done"
  const [step,setStep]     = useState(brandsOnly ? "verify" : "pay");
  // "verify" sub-steps: "email" | "code"
  const [verifyStep,setVerifyStep] = useState("email");

  const [name,setName]       = useState("");
  const [email,setEmail]     = useState("");
  const [phone,setPhone]     = useState("");
  const [code,setCode]       = useState("");
  const [codeErr,setCodeErr] = useState("");
  const [loading,setLoading] = useState(false);
  const [err,setErr]         = useState("");
  const [done,setDone]       = useState(false);

  const sendSMS = async msg => {
    try{ await fetch(SMS_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({messages:[{phoneNumber:"+18062248515",message:msg}]})}); }catch{}
  };

  // Step 1a: send OTP to brand email
  const sendOTP = async () => {
    setErr(""); setLoading(true);
    try{
      const r = await fetch(`${API}/brand/send-otp`,{method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email})});
      const d = await r.json();
      if(d.success){ setVerifyStep("code"); }
      else setErr(d.error||"Failed to send code");
    }catch{ setErr("Network error — please try again"); }
    setLoading(false);
  };

  // Step 1b: verify OTP
  const verifyOTP = async () => {
    setCodeErr(""); setLoading(true);
    try{
      const r = await fetch(`${API}/brand/verify-otp`,{method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email,code})});
      const d = await r.json();
      if(d.success){ setStep("pay"); }
      else setCodeErr(d.error||"Incorrect code");
    }catch{ setCodeErr("Network error"); }
    setLoading(false);
  };

  // Final: Stripe payment
  const pay = async () => {
    if(!name.trim()){ setErr("Please enter your name"); return; }
    if(!email.trim()){ setErr("Please enter your email"); return; }
    setErr(""); setLoading(true);

    if(price===0){
      await sendSMS(`💬 ENQUIRY\nCreator: @${profileUsername}\nService: ${service.company}\nFrom: ${name} · ${email}`);
      setDone(true); setLoading(false); return;
    }

    // Notify admin someone is attempting payment
    sendSMS(`💳 PAYMENT ATTEMPT\nCreator: @${profileUsername}\nService: ${service.company} · $${price}\nBuyer: ${name} · ${email}`);

    try{
      // Load Stripe checkout.js if not already loaded
      if(!window.StripeCheckout){
        await new Promise((res,rej)=>{
          const s=document.createElement("script");
          s.src="https://checkout.stripe.com/checkout.js";
          s.onload=res; s.onerror=rej;
          document.head.appendChild(s);
        });
      }
      const handler = window.StripeCheckout.configure({
        key: STRIPE_PK,
        locale:"auto",
        token: async token => {
          try{
            const r = await fetch(PAY_ENDPOINT,{
              method:"POST",
              headers:{"Content-Type":"application/json","Authorization":STRIPE_SK},
              body:JSON.stringify({
                email:token.email, amount:price*100,
                token:token.id, customerName:name,
                phoneNumber:phone, streetAddress:email,
              }),
            });
            if(r.ok){
              await sendSMS(`💰 PAID!\nCreator: @${profileUsername}\nService: ${service.company}\nAmount: $${price}\nBuyer: ${name} · ${token.email}`);
              setDone(true);
            } else {
              await sendSMS(`❌ Payment FAILED\nCreator: @${profileUsername}\nService: ${service.company}\n$${price}\n${name}`);
              setErr("Payment failed — please try again");
            }
          }catch{ setErr("Network error during payment"); }
          setLoading(false);
        },
        closed: ()=>setLoading(false),
      });
      handler.open({
        name: service.company,
        description: `@${profileUsername}`,
        currency:"USD",
        amount: price*100,
        email,
      });
    }catch(e){ console.error(e); setErr("Payment setup failed"); setLoading(false); }
  };

  const Spinner = () => (
    <span style={{width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",
      borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block"}}/>
  );

  return(
    <div className="pay-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="pay-modal">
        <button className="pay-close" onClick={onClose}>✕</button>

        {/* ── SELF-PAYMENT MODE: Contact Creator ── */}
        {isSelfPayment&&(
          <div>
            <div style={{textAlign:"center",paddingBottom:16,marginBottom:16,borderBottom:"1px solid rgba(255,255,255,.08)"}}>
              <div style={{fontSize:36,marginBottom:8}}>🤝</div>
              <div style={{fontFamily:"Instrument Serif",fontSize:22,marginBottom:4,color:"#fff"}}>{service.company}</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,.4)"}}>by @{profileUsername}</div>
              {price>0&&<div style={{fontFamily:"'Instrument Serif',serif",fontSize:28,color:"#a5b4fc",marginTop:8}}>${price.toLocaleString()}</div>}
            </div>

            <div style={{background:"rgba(99,102,241,.15)",border:"1.5px solid rgba(165,180,252,.3)",borderRadius:12,padding:"16px 18px",marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:14,color:"#a5b4fc",marginBottom:6}}>💬 Message the creator to book</div>
              <div style={{fontSize:13.5,color:"rgba(255,255,255,.65)",lineHeight:1.6}}>
                This creator handles their own payments and scheduling. Reach out directly to arrange the service, pricing, and payment method.
              </div>
            </div>

            <div style={{fontSize:12,color:"rgba(255,255,255,.25)",textAlign:"center",borderTop:"1px solid rgba(255,255,255,.07)",paddingTop:14}}>
              Tip: Mention the service name and any context about your brand when you reach out.
            </div>
          </div>
        )}

        {/* ── NORMAL STRIPE FLOW (truebounty payment mode) ── */}
        {!isSelfPayment&&(<>

        {/* ── DONE ── */}
        {done&&(
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{fontSize:56,marginBottom:14}}>🎉</div>
            <div style={{fontFamily:"Instrument Serif",fontSize:26,marginBottom:8}}>You're all set!</div>
            <div style={{fontSize:14,color:"rgba(255,255,255,.4)",lineHeight:1.7,marginBottom:24}}>
              {price===0?"Your enquiry has been sent.":"Payment confirmed! ✓"}<br/>
              @{profileUsername} will be in touch soon.
            </div>
            <button className="pay-submit" onClick={onClose}>Close</button>
          </div>
        )}

        {/* ── BRAND VERIFY — email step ── */}
        {!done&&step==="verify"&&verifyStep==="email"&&(
          <div>
            <div style={{textAlign:"center",marginBottom:20,paddingTop:4}}>
              <div style={{fontSize:32,marginBottom:10}}>🔒</div>
              <div style={{fontFamily:"Instrument Serif",fontSize:22,marginBottom:6}}>Verified brands only</div>
              <div style={{fontSize:13.5,color:"rgba(255,255,255,.4)",lineHeight:1.65}}>
                This creator's pricing is available to verified brands.<br/>
                Enter your <strong>business email</strong> to receive a verification code.
              </div>
            </div>
            <div style={{height:1,background:"rgba(255,255,255,.08)",margin:"0 0 18px"}}/>
            <div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:6,fontWeight:600}}>Business email address</div>
            <input className="pay-field" type="email"
              placeholder="you@yourcompany.com"
              value={email} onChange={e=>{setEmail(e.target.value);setErr("");}}
              onKeyDown={e=>e.key==="Enter"&&sendOTP()}/>
            <div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:14}}>
              ⚠️ Gmail, Yahoo and personal emails are not accepted
            </div>
            {err&&<div style={{color:"#f87171",fontSize:13,marginBottom:12,background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.3)",padding:"9px 12px",borderRadius:8}}>⚠ {err}</div>}
            <button className="pay-submit" onClick={sendOTP} disabled={loading||!email}>
              {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spinner/> Sending…</span>:"Send Verification Code →"}
            </button>
            <div style={{textAlign:"center",marginTop:12,fontSize:12,color:"rgba(255,255,255,.4)"}}>
              We'll send a 6-digit code to verify your business email
            </div>
          </div>
        )}

        {/* ── BRAND VERIFY — OTP step ── */}
        {!done&&step==="verify"&&verifyStep==="code"&&(
          <div>
            <div style={{textAlign:"center",marginBottom:20,paddingTop:4}}>
              <div style={{fontSize:32,marginBottom:10}}>📧</div>
              <div style={{fontFamily:"Instrument Serif",fontSize:22,marginBottom:6}}>Check your inbox</div>
              <div style={{fontSize:13.5,color:"rgba(255,255,255,.4)",lineHeight:1.65}}>
                We sent a 6-digit code to<br/>
                <strong style={{color:"#e8e6ff"}}>{email}</strong>
              </div>
            </div>
            <div style={{height:1,background:"rgba(255,255,255,.08)",margin:"0 0 18px"}}/>
            <div style={{fontSize:12,color:"rgba(255,255,255,.4)",marginBottom:6,fontWeight:600}}>Verification code</div>
            <input className="pay-field"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={e=>{setCode(e.target.value.replace(/\D/g,"").slice(0,6));setCodeErr("");}}
              onKeyDown={e=>e.key==="Enter"&&code.length===6&&verifyOTP()}
              style={{fontSize:22,fontWeight:700,letterSpacing:6,textAlign:"center"}}
              maxLength={6}/>
            {codeErr&&<div style={{color:"#f87171",fontSize:13,marginBottom:12,background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.3)",padding:"9px 12px",borderRadius:8}}>⚠ {codeErr}</div>}
            <button className="pay-submit" onClick={verifyOTP} disabled={loading||code.length!==6}>
              {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spinner/> Verifying…</span>:"Verify & See Pricing →"}
            </button>
            <div style={{textAlign:"center",marginTop:12}}>
              <button style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",fontSize:12,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}
                onClick={()=>{setVerifyStep("email");setCode("");setCodeErr("");}}>
                ← Use different email
              </button>
              <span style={{color:"var(--border)",margin:"0 8px"}}>·</span>
              <button style={{background:"none",border:"none",color:"#a5b4fc",fontSize:12,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}
                onClick={()=>{setCode("");setCodeErr("");sendOTP();}}>
                Resend code
              </button>
            </div>
          </div>
        )}

        {/* ── PAY ── */}
        {!done&&step==="pay"&&(
          <div>
            <div style={{textAlign:"center",marginBottom:16,paddingTop:4}}>
              {brandsOnly&&(
                <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(74,222,128,.15)",color:"#4ade80",borderRadius:100,padding:"4px 12px",fontSize:12,fontWeight:700,marginBottom:12}}>
                  ✓ Business email verified
                </div>
              )}
              <div style={{display:"block",background:"rgba(99,102,241,.2)",color:"#a5b4fc",fontSize:11,fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",padding:"4px 12px",borderRadius:100,marginBottom:10}}>
                You're booking
              </div>
              <div style={{fontSize:19,fontWeight:700,color:"#e8e6ff",marginBottom:4,lineHeight:1.3}}>{service.company}</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,.4)",marginBottom:10}}>with @{profileUsername}</div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:40,fontWeight:700,color:"#a5b4fc",letterSpacing:"-.02em"}}>
                {price===0?"Let's talk":`$${price.toLocaleString()}`}
              </div>
              {price>0&&<div style={{fontSize:12,color:"rgba(255,255,255,.35)",marginTop:3}}>One-time · USD · Stripe secured</div>}
            </div>

            <div style={{height:1,background:"rgba(255,255,255,.08)",margin:"0 0 16px"}}/>

            {err&&<div style={{color:"#f87171",fontSize:13,marginBottom:12,background:"rgba(239,68,68,.12)",border:"1px solid rgba(239,68,68,.3)",padding:"9px 12px",borderRadius:8}}>⚠ {err}</div>}

            <input className="pay-field" placeholder="Your name" value={name}
              onChange={e=>{setName(e.target.value);setErr("");}}/>
            {!brandsOnly&&(
              <input className="pay-field" type="email" placeholder="Email address" value={email}
                onChange={e=>{setEmail(e.target.value);setErr("");}}/>
            )}
            {brandsOnly&&(
              <div style={{padding:"10px 12px",background:"rgba(99,102,241,.07)",borderRadius:8,fontSize:13,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                <span>✓</span><strong>{email}</strong><span style={{color:"rgba(255,255,255,.4)"}}>— verified business</span>
              </div>
            )}
            <input className="pay-field" placeholder="Phone (optional)" value={phone}
              onChange={e=>setPhone(e.target.value)}/>

            <button className="pay-submit" onClick={pay} disabled={loading}>
              {loading
                ?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spinner/> Processing…</span>
                :price===0?"Send Enquiry →":`Pay $${price.toLocaleString()} →`}
            </button>

            <div style={{display:"flex",justifyContent:"center",gap:20,marginTop:14,flexWrap:"wrap"}}>
              {["🔒 Stripe secured","⚡ Instant confirmation","💬 Support included"].map(t=>(
                <span key={t} style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{t}</span>
              ))}
            </div>
          </div>
        )}

        </>)}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATOR PROFILE VIEW — shown when a user has creator services
// ─────────────────────────────────────────────────────────────────────────────
function CreatorProfileView({profile, bounties, isOwner, currentUser, onNavigate, showToast}){
  const [payTarget,setPayTarget]=useState(null);
  const [editOpen,setEditOpen]=useState(false);
  const [editingSvc,setEditingSvc]=useState(null); // {bounty} for edit popup
  const [editSvcForm,setEditSvcForm]=useState({});
  const [savingSvc,setSavingSvc]=useState(false);
  // Profile-level brand settings — initialized after profile loads
  const [profileBrandSettings,setProfileBrandSettings]=useState({hideFromPublic:false,hidePrices:false});
  const [savingBrandSettings,setSavingBrandSettings]=useState(false);

  const [paymentMode,setPaymentMode]=useState(profile?.paymentMode||'truebounty');
  const [paypalEmail,setPaypalEmail]=useState(profile?.paypalEmail||'');
  const [savingPayment,setSavingPayment]=useState(false);

  const savePaymentPref=async(mode,ppEmail)=>{
    setSavingPayment(true);
    try{
      await fetch(`${API}/profile`,{method:'PATCH',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${currentUser?.token}`},
        body:JSON.stringify({paymentMode:mode,paypalEmail:ppEmail||''})});
      showToast('Payment preference saved ✓','success');
    }catch{showToast('Network error','error');}
    setSavingPayment(false);
  };

  // Sync brand settings from loaded profile
  useEffect(()=>{
    setPaymentMode(profile?.paymentMode||'truebounty');
    setPaypalEmail(profile?.paypalEmail||'');
    if(profile?.categories){
      setProfileBrandSettings({
        hideFromPublic: profile.categories.includes('brands-hide-all'),
        hidePrices:     profile.categories.includes('brands-hide-prices'),
      });
    }
  },[profile]);

  // Edit panel state — per-category, same UX as footer creator onboarding
  const initEdit=()=>{
    const s={};
    CREATOR_CATS.forEach(cat=>{
      const svcs={};
      cat.services.forEach(sv=>{svcs[sv.id]={on:false,price:""};});
      s[cat.id]={enabled:false,brandsOnly:false,services:svcs};
    });
    return s;
  };
  const [editCats,setEditCats]=useState(initEdit);
  const [saving,setSaving]=useState(false);
  const [deletingId,setDeletingId]=useState(null);

  const catMeta={
    twitter:{icon:"𝕏",label:"Twitter / X",backendCat:"influencer"},
    newsletter:{icon:"📧",label:"Newsletter",backendCat:"content"},
    youtube:{icon:"▶️",label:"YouTube",backendCat:"influencer"},
    tiktok:{icon:"🎵",label:"TikTok",backendCat:"influencer"},
    instagram:{icon:"📸",label:"Instagram",backendCat:"influencer"},
    podcast:{icon:"🎙️",label:"Podcast",backendCat:"content"},
    community:{icon:"👥",label:"Community",backendCat:"beta_users"},
    speaking:{icon:"🎤",label:"Speaking & Events",backendCat:"advisor"},
    writing:{icon:"✍️",label:"Writing & Content",backendCat:"content"},
    hired:{icon:"💼",label:"Get Hired",backendCat:"hiring_help"},
    developer:{icon:"🔧",label:"Developer",backendCat:"engineering"},
    design:{icon:"🎨",label:"Design",backendCat:"design_help"},
    marketing:{icon:"📣",label:"Marketing",backendCat:"marketing"},
    sales:{icon:"📈",label:"Sales & BD",backendCat:"sales_lead"},
    finance:{icon:"💰",label:"Finance & Legal",backendCat:"fundraising"},
  };
  const catOrder=Object.keys(catMeta);
  const backendToCat={influencer:["twitter","tiktok","instagram","youtube"],content:["newsletter","writing","podcast"],podcast_guest:["podcast"],beta_users:["community"],advisor:["speaking"],hiring_help:["hired"],engineering:["developer"],design_help:["design"],marketing:["marketing"],sales_lead:["sales"],fundraising:["finance"]};

  const grouped={};
  // Brand visibility: if hideFromPublic is on AND visitor is not owner → hide all services
  const hideAll = profileBrandSettings.hideFromPublic && !isOwner;
  const hidePricesFromPublic = profileBrandSettings.hidePrices && !isOwner;

  bounties.filter(b=>b.status==="active").forEach(b=>{
    const cats=backendToCat[b.category]||["hired"];
    const cat=cats[0];
    if(!grouped[cat]) grouped[cat]=[];
    grouped[cat].push(b);
  });
  const activeCats=catOrder.filter(c=>grouped[c]?.length>0);
  const initials=(profile.username||"?").slice(0,2).toUpperCase();
  const pageUrl=window.location.href;

  const toggleEditCat=id=>setEditCats(p=>({...p,[id]:{...p[id],enabled:!p[id].enabled}}));
  const toggleEditSvc=(catId,svcId)=>setEditCats(p=>({
    ...p,[catId]:{...p[catId],services:{...p[catId].services,
      [svcId]:{...p[catId].services[svcId],on:!p[catId].services[svcId].on}}}
  }));
  const setEditSvcPrice=(catId,svcId,val)=>setEditCats(p=>({
    ...p,[catId]:{...p[catId],services:{...p[catId].services,
      [svcId]:{...p[catId].services[svcId],price:val}}}
  }));
  const setEditBrandsOnly=(catId,val)=>setEditCats(p=>({...p,[catId]:{...p[catId],brandsOnly:val}}));

  const totalSelected=Object.values(editCats).reduce((sum,cat)=>
    sum+Object.values(cat.services).filter(s=>s.on).length,0);

  const saveServices=async()=>{
    setSaving(true);
    const catMap={twitter:"influencer",newsletter:"content",youtube:"influencer",tiktok:"influencer",instagram:"influencer",podcast:"podcast_guest",community:"beta_users",speaking:"advisor",writing:"content",hired:"hiring_help",developer:"engineering",design:"design_help",marketing:"marketing",sales:"sales_lead",finance:"fundraising"};
    try{
      const creates=[];
      CREATOR_CATS.forEach(cat=>{
        const cs=editCats[cat.id];
        if(!cs.enabled) return;
        cat.services.forEach(sv=>{
          const s=cs.services[sv.id];
          if(!s?.on) return;
          creates.push(fetch(`${API}/bounty`,{method:"POST",
            headers:{"Content-Type":"application/json","Authorization":`Bearer ${currentUser?.token}`},
            body:JSON.stringify({
              company:sv.label,
              category:catMap[cat.id]||"advisor",
              amount:Number(s.price)||0,
              description:sv.desc+(cs.brandsOnly?" [brands-only]":""),
              status:"active",
            })}));
        });
      });
      await Promise.all(creates);
      showToast(`✅ ${creates.length} service${creates.length!==1?"s":""} added!`,"success");
      setEditOpen(false);
      setEditCats(initEdit());
      window.location.reload();
    }catch{showToast("Error saving — please try again","error");}
    setSaving(false);
  };

  const deleteService=async id=>{
    if(!window.confirm("Remove this service?")) return;
    setDeletingId(id);
    try{
      const r=await fetch(`${API}/bounty/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${currentUser?.token}`}});
      const d=await r.json();
      if(d.success){showToast("Service removed","success");window.location.reload();}
      else showToast(d.error||"Error","error");
    }catch{showToast("Network error","error");}
    setDeletingId(null);
  };

  // Auction bid modal
  const [auctionOpen,setAuctionOpen]=useState(null);
  const [auctionBid,setAuctionBid]=useState("");
  const [auctionBidder,setAuctionBidder]=useState("");
  const [auctionEmail,setAuctionEmail]=useState("");
  const [auctionDone,setAuctionDone]=useState(false);
  // Brand verification state for brandsOnly auctions
  const [brandVerifStep,setBrandVerifStep]=useState("email"); // "email" | "code" | "verified"
  const [brandBizEmail,setBrandBizEmail]=useState("");
  const [brandOtpCode,setBrandOtpCode]=useState("");
  const [brandVerifLoading,setBrandVerifLoading]=useState(false);
  const [brandVerifErr,setBrandVerifErr]=useState("");

  const submitAuctionBid=async()=>{
    if(!auctionBidder||!auctionEmail||!auctionBid) return;
    const auctionBounty=bounties.find(b=>b._id===auctionOpen);
    const floor=auctionBounty?.amount||0;
    if(floor>0&&Number(auctionBid)<floor) return;
    try{
      const r=await fetch(`${API}/bounty/${auctionOpen}/accept`,{method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({name:auctionBidder,email:auctionEmail,message:`bid:${auctionBid}`,proof:""})});
      const d=await r.json();
      if(d.success) setAuctionDone(true);
    }catch{}
  };


  const saveBrandSettings=async(newSettings)=>{
    setSavingBrandSettings(true);
    // Store as special category flags on the user profile
    try{
      const r=await fetch(`${API}/profile`,{method:"PATCH",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${currentUser?.token}`},
        body:JSON.stringify({brandSettings:newSettings})});
      const d=await r.json();
      if(d.success) showToast("Settings saved","success");
      else showToast(d.error||"Error","error");
    }catch{showToast("Network error","error");}
    setSavingBrandSettings(false);
  };

  const deleteSvc=async(bountyId)=>{
    if(!window.confirm("Delete this service? This cannot be undone.")) return;
    setDeletingId(bountyId);
    try{
      const r=await fetch(`${API}/bounty/${bountyId}`,{method:"DELETE",
        headers:{Authorization:`Bearer ${currentUser?.token}`}});
      const d=await r.json();
      if(d.success){showToast("Service deleted","success");window.location.reload();}
      else showToast(d.error||"Error","error");
    }catch{showToast("Network error","error");}
    setDeletingId(null);
  };

  const saveEditSvc=async()=>{
    if(!editingSvc) return;
    setSavingSvc(true);
    try{
      const r=await fetch(`${API}/bounty/${editingSvc._id}`,{method:"PATCH",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${currentUser?.token}`},
        body:JSON.stringify({company:editSvcForm.name,amount:Number(editSvcForm.price)||0,description:editSvcForm.desc})});
      const d=await r.json();
      if(d.success){showToast("Saved!","success");setEditingSvc(null);window.location.reload();}
      else showToast(d.error||"Error","error");
    }catch{showToast("Network error","error");}
    setSavingSvc(false);
  };

  return(
    <div className="cr-profile-wrap">
      {/* Hero */}
      <div className="cr-profile-hero">
        <div className="cr-p-inner">
          <div className="cr-p-top">
            <div className="cr-p-av">
              {profile.avatarUrl?<img src={profile.avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>:initials}
            </div>
            <div style={{flex:1}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(99,102,241,.2)",border:"1px solid rgba(165,180,252,.3)",borderRadius:100,padding:"4px 12px",fontSize:11,fontWeight:700,color:"#a5b4fc",letterSpacing:".06em",marginBottom:10}}>✨ CREATOR PROFILE</div>
              <div className="cr-p-name">@{profile.username}</div>
              {activeCats.length>0&&<div className="cr-p-tags">{activeCats.map(c=><span key={c} className="cr-p-tag">{catMeta[c]?.icon} {catMeta[c]?.label}</span>)}</div>}
              {profile.linkedinProfile&&<a href={profile.linkedinProfile} target="_blank" rel="noreferrer" style={{color:"rgba(255,255,255,.4)",fontSize:13,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:5,marginTop:8}}>🔗 LinkedIn</a>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
              {isOwner&&<button className="btn btn-ghost btn-sm" style={{color:"rgba(255,255,255,.6)",borderColor:"rgba(255,255,255,.2)"}} onClick={()=>onNavigate("dashboard")}>Dashboard →</button>}
              {isOwner&&<button className="btn btn-accent btn-sm" onClick={()=>setEditOpen(!editOpen)}>{editOpen?"✕ Close editing":"✏️ Edit services"}</button>}
            </div>
          </div>

          {/* ── OWNER-ONLY CONTROLS — only visible to owner ── */}
          {isOwner&&(
            <div style={{marginTop:16,border:"1.5px dashed rgba(165,180,252,.2)",borderRadius:16,overflow:"hidden"}}>
              {/* Label */}
              <div style={{display:"flex",alignItems:"center",gap:7,padding:"7px 14px",background:"rgba(99,102,241,.1)",borderBottom:"1px solid rgba(165,180,252,.12)"}}>
                <span style={{fontSize:12}}>👁</span>
                <span style={{fontSize:11,fontWeight:700,color:"#a5b4fc",letterSpacing:".06em",textTransform:"uppercase"}}>Only visible to you</span>
              </div>
              <div style={{padding:"14px",display:"flex",flexDirection:"column",gap:12}}>

                {/* Brand visibility switches */}
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[
                    {key:"hideFromPublic", label:"Services visible to verified brands only", icon:"🔒"},
                    {key:"hidePrices",     label:"Hide prices from public",                   icon:"💰"},
                  ].map(({key,label,icon})=>{
                    const on=profileBrandSettings[key];
                    return(
                      <div key={key} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,.05)",border:`1px solid ${on?"rgba(165,180,252,.3)":"rgba(255,255,255,.08)"}`,borderRadius:10,padding:"9px 14px",cursor:"pointer",transition:"all .15s",flex:1,minWidth:200}}
                        onClick={()=>{const next={...profileBrandSettings,[key]:!on};setProfileBrandSettings(next);saveBrandSettings(next);}}>
                        <div style={{width:36,height:20,borderRadius:100,background:on?"#6366f1":"rgba(255,255,255,.15)",position:"relative",flexShrink:0,transition:"background .15s"}}>
                          <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:on?18:2,transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}}/>
                        </div>
                        <div>
                          <div style={{fontSize:12.5,fontWeight:600,color:on?"#a5b4fc":"rgba(255,255,255,.55)"}}>{icon} {label}</div>
                          <div style={{fontSize:11,color:"rgba(255,255,255,.25)",marginTop:1}}>{on?"ON — only verified brands can see this":"OFF — visible to everyone"}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Payment preference */}
                <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"12px 14px"}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#fff",marginBottom:10}}>💳 How would you like to get paid?</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:paymentMode==="truebounty"?12:0}}>
                    {[
                      {id:"truebounty", label:"TrueBounty handles payments", sub:"Stripe checkout — we collect & forward", icon:"🏦"},
                      {id:"self",       label:"I handle my own payments",     sub:"Book button shows contact message",     icon:"🤝"},
                    ].map(opt=>{
                      const on=paymentMode===opt.id;
                      return(
                        <div key={opt.id} onClick={()=>{setPaymentMode(opt.id);if(opt.id==="self")savePaymentPref("self",paypalEmail);}}
                          style={{flex:1,minWidth:160,border:`2px solid ${on?"#6366f1":"rgba(255,255,255,.1)"}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",background:on?"rgba(99,102,241,.2)":"rgba(255,255,255,.03)",transition:"all .15s"}}>
                          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                            <span style={{fontSize:18}}>{opt.icon}</span>
                            <div style={{fontWeight:700,fontSize:12.5,color:on?"#a5b4fc":"rgba(255,255,255,.65)"}}>{opt.label}</div>
                            {on&&<span style={{marginLeft:"auto",fontSize:10,background:"#6366f1",color:"#fff",borderRadius:100,padding:"2px 7px",fontWeight:700,flexShrink:0}}>ACTIVE</span>}
                          </div>
                          <div style={{fontSize:11,color:on?"rgba(165,180,252,.55)":"rgba(255,255,255,.3)",paddingLeft:25}}>{opt.sub}</div>
                        </div>
                      );
                    })}
                  </div>
                  {paymentMode==="truebounty"&&(
                    <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap"}}>
                      <div style={{flex:1,minWidth:180}}>
                        <div style={{fontSize:11.5,color:"rgba(255,255,255,.4)",marginBottom:5}}>Your PayPal email — we send payments here</div>
                        <input type="email" placeholder="you@paypal.com" value={paypalEmail} onChange={e=>setPaypalEmail(e.target.value)}
                          style={{width:"100%",background:"rgba(255,255,255,.08)",border:"1.5px solid rgba(255,255,255,.15)",borderRadius:8,padding:"8px 12px",fontSize:13,fontFamily:"'Inter',sans-serif",color:"#fff",outline:"none",boxSizing:"border-box"}}/>
                      </div>
                      <button onClick={()=>savePaymentPref("truebounty",paypalEmail)} disabled={savingPayment||!paypalEmail}
                        style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",flexShrink:0,opacity:(!paypalEmail||savingPayment)?.5:1}}>
                        {savingPayment?"Saving…":"Save"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Share link */}
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:150,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"8px 12px",fontSize:12,fontFamily:"monospace",color:"rgba(255,255,255,.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pageUrl}</div>
                  <button style={{background:"rgba(255,255,255,.1)",border:"1.5px solid rgba(255,255,255,.15)",borderRadius:100,padding:"8px 16px",color:"#fff",fontSize:12.5,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap"}}
                    onClick={()=>{navigator.clipboard.writeText(pageUrl);showToast("Link copied! 🚀","success");}}>📋 Copy link</button>
                  {[{icon:"𝕏",url:`https://twitter.com/intent/tweet?text=${encodeURIComponent("Check out my creator page:")}&url=${encodeURIComponent(pageUrl)}`},{icon:"in",url:`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}].map(n=>(
                    <a key={n.icon} href={n.url} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:34,height:34,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"50%",color:"rgba(255,255,255,.6)",textDecoration:"none",fontSize:13,fontWeight:800}}>{n.icon}</a>
                  ))}
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── OWNER EDIT PANEL — same UX as footer creator flow ── */}
      {isOwner&&editOpen&&(
        <div style={{background:"#0f0d2e",borderBottom:"2px solid rgba(165,180,252,.15)"}}>
          <div style={{maxWidth:860,margin:"0 auto",padding:"28px 20px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <div>
                <div style={{fontWeight:700,fontSize:17,color:"#fff"}}>✏️ Add more services</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.4)",marginTop:3}}>Check what you offer · set prices · hit save</div>
              </div>
              {totalSelected>0&&(
                <button onClick={saveServices} disabled={saving}
                  style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",borderRadius:100,padding:"11px 24px",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap",boxShadow:"0 4px 16px rgba(99,102,241,.4)"}}>
                  {saving?`Saving…`:`Add ${totalSelected} service${totalSelected!==1?"s":""} →`}
                </button>
              )}
            </div>

            {/* Existing services — quick view with remove */}
            {activeCats.length>0&&(
              <div style={{marginBottom:20,padding:"12px 14px",background:"rgba(255,255,255,.04)",borderRadius:10,border:"1px solid rgba(255,255,255,.08)"}}>
                <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"rgba(255,255,255,.3)",marginBottom:10}}>Current services — remove any</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {activeCats.flatMap(catId=>(grouped[catId]||[]).map(b=>(
                    <div key={b._id} style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",borderRadius:100,padding:"5px 10px 5px 12px",fontSize:12,color:"rgba(255,255,255,.75)"}}>
                      <span>{catMeta[catId]?.icon}</span>
                      <span>{b.company}</span>
                      <span style={{color:"rgba(255,255,255,.4)"}}>·</span>
                      <span style={{color:"#a78bfa",fontWeight:600}}>${b.amount}</span>
                      <button onClick={()=>deleteService(b._id)} disabled={deletingId===b._id}
                        style={{background:"rgba(239,68,68,.2)",border:"none",borderRadius:"50%",width:18,height:18,color:"#fca5a5",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,fontFamily:"'Inter',sans-serif"}}>
                        {deletingId===b._id?"…":"✕"}
                      </button>
                    </div>
                  )))}
                </div>
              </div>
            )}

            {/* Category sections — same as footer */}
            {CREATOR_CATS.map(cat=>{
              const cs=editCats[cat.id];
              const selCount=Object.values(cs.services).filter(s=>s.on).length;
              return(
                <div key={cat.id} style={{
                  background:"rgba(255,255,255,.06)",border:`1.5px solid ${cs.enabled?"rgba(165,180,252,.4)":"rgba(255,255,255,.1)"}`,
                  borderRadius:12,marginBottom:8,overflow:"hidden",transition:"border-color .14s"
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:"pointer"}} onClick={()=>toggleEditCat(cat.id)}>
                    <span style={{fontSize:18}}>{cat.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13.5,color:"#fff"}}>{cat.label}</div>
                      {cs.enabled&&selCount>0&&<div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginTop:1}}>{selCount} selected</div>}
                    </div>
                    {cs.enabled&&selCount>0&&<span style={{background:"#6366f1",color:"#fff",borderRadius:100,padding:"2px 9px",fontSize:11,fontWeight:700}}>{selCount}</span>}
                    <div style={{width:38,height:21,borderRadius:100,background:cs.enabled?"#6366f1":"rgba(255,255,255,.15)",position:"relative",transition:"background .15s",flexShrink:0}}>
                      <div style={{width:17,height:17,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:cs.enabled?19:2,transition:"left .15s"}}/>
                    </div>
                  </div>
                  {cs.enabled&&(
                    <div style={{borderTop:"1px solid rgba(255,255,255,.08)",padding:"12px 16px"}}>
                      {/* Brands-only toggle */}
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,padding:"7px 10px",background:"rgba(255,255,255,.05)",borderRadius:7}}>
                        <div style={{width:32,height:18,borderRadius:100,background:cs.brandsOnly?"#6366f1":"rgba(255,255,255,.15)",position:"relative",cursor:"pointer",transition:"background .14s",flexShrink:0}}
                          onClick={()=>setEditBrandsOnly(cat.id,!cs.brandsOnly)}>
                          <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:cs.brandsOnly?16:2,transition:"left .14s"}}/>
                        </div>
                        <span style={{fontSize:12,color:"rgba(255,255,255,.6)"}}>🔒 Brands only — hide prices from public</span>
                      </div>
                      {/* Services grid */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                        {cat.services.map(sv=>{
                          const s=editCats[cat.id].services[sv.id]||{on:false,price:""};
                          return(
                            <div key={sv.id} style={{
                              border:`1.5px solid ${s.on?"rgba(165,180,252,.5)":"rgba(255,255,255,.1)"}`,
                              borderRadius:8,background:s.on?"rgba(99,102,241,.12)":"rgba(255,255,255,.03)",
                              padding:"8px 10px",transition:"all .12s"
                            }}>
                              <div style={{display:"flex",alignItems:"flex-start",gap:6,cursor:"pointer"}} onClick={()=>toggleEditSvc(cat.id,sv.id)}>
                                <div style={{width:15,height:15,borderRadius:4,flexShrink:0,marginTop:1,border:`1.5px solid ${s.on?"#a5b4fc":"rgba(255,255,255,.25)"}`,background:s.on?"#6366f1":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff"}}>{s.on?"✓":""}</div>
                                <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,.8)",lineHeight:1.3}}>{sv.label}</div>
                              </div>
                              {s.on&&(
                                <div style={{display:"flex",alignItems:"center",gap:4,marginTop:6}}>
                                  <span style={{fontSize:12,color:"rgba(255,255,255,.4)"}}>$</span>
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    placeholder="Price"
                                    value={s.price}
                                    onChange={e=>setEditSvcPrice(cat.id,sv.id,e.target.value)}
                                    style={{flex:1,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.2)",borderRadius:5,padding:"4px 7px",fontSize:12,fontWeight:700,fontFamily:"'Inter',sans-serif",color:"#fff",minWidth:0,outline:"none"}}/>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {totalSelected>0&&(
              <button onClick={saveServices} disabled={saving}
                style={{width:"100%",marginTop:12,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",borderRadius:100,padding:"14px",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",boxShadow:"0 4px 20px rgba(99,102,241,.35)"}}>
                {saving?`Saving…`:`✅ Add ${totalSelected} service${totalSelected!==1?"s":""} to my profile`}
              </button>
            )}
            {totalSelected===0&&(
              <div style={{textAlign:"center",padding:"10px 0 4px",color:"rgba(255,255,255,.25)",fontSize:13}}>
                👆 Toggle a category and check services to add them
              </div>
            )}
          </div>
        </div>
      )}

      {/* Services */}
      <div className="cr-services-area">
        {/* Brand visibility gate */}
        {hideAll?(
          <div style={{textAlign:"center",padding:"60px 24px",background:"rgba(99,102,241,.06)",border:"1.5px solid rgba(165,180,252,.15)",borderRadius:20,margin:"32px 0"}}>
            <div style={{fontSize:48,marginBottom:16}}>🔒</div>
            <div style={{fontFamily:"'Instrument Serif',serif",fontSize:24,color:"#fff",marginBottom:8}}>Verified Brands Only</div>
            <div style={{fontSize:14,color:"rgba(255,255,255,.45)",lineHeight:1.7,maxWidth:400,margin:"0 auto 24px"}}>
              This creator's services are only available to verified businesses.
              Contact the creator directly to request brand access.
            </div>
          </div>
        ):(
          <>
        {activeCats.length===0?(
          <div className="empty">
            <div className="icon">✨</div>
            <p>No services listed yet.</p>
            {isOwner&&<button className="btn btn-accent" style={{marginTop:16}} onClick={()=>setEditOpen(true)}>+ Add your first service</button>}
          </div>
        ):activeCats.map(catId=>{
          const svcs=grouped[catId];
          const meta=catMeta[catId];
          return(
            <div key={catId} className="cr-cat-section">
              <div className="cr-cat-hd">
                <span className="cr-cat-icon">{meta.icon}</span>
                <span className="cr-cat-label">{meta.label}</span>
                <span className="cr-cat-count">{svcs.length} service{svcs.length!==1?"s":""}</span>
                {isOwner&&<button style={{marginLeft:"auto",background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.3)",borderRadius:8,padding:"4px 12px",color:"var(--accent)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}} onClick={()=>setEditOpen(true)}>+ Add</button>}
              </div>
              <div className="cr-svc-grid">
                {svcs.map(b=>{
                  const brandsOnly=b.description?.includes("[brands-only]");
                  const isAuction=b.description?.includes("[auction]");
                  const cleanDesc=b.description?.replace(/\s?\[brands-only\]/g,"").replace(/\s?\[auction\]/g,"");
                  const deadline=b.auctionDeadline?new Date(b.auctionDeadline):null;
                  const deadlinePassed=deadline&&deadline<new Date();
                  const deadlineLabel=deadline
                    ?deadlinePassed?"Auction closed":`Closes ${deadline.toLocaleDateString('en-US',{month:'short',day:'numeric'})} · ${deadline.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}`
                    :"No deadline set";

                  const saveAuction=async(newDesc, newDeadline, newAmount)=>{
                    try{
                      const r=await fetch(`${API}/bounty/${b._id}`,{method:"PATCH",
                        headers:{"Content-Type":"application/json","Authorization":`Bearer ${currentUser?.token}`},
                        body:JSON.stringify({description:newDesc,auctionDeadline:newDeadline||null,amount:newAmount??b.amount})});
                      const d=await r.json();
                      if(d.success){showToast("Saved!","success");window.location.reload();}
                      else showToast(d.error||"Error","error");
                    }catch{showToast("Network error","error");}
                  };

                  const toggleAuctionOnProfile=()=>{
                    const newDesc=isAuction
                      ?b.description.replace(/\s?\[auction\]/g,"")
                      :(b.description||"")+" [auction]";
                    saveAuction(newDesc, isAuction?null:b.auctionDeadline, b.amount);
                  };

                  return(
                    <div key={b._id} id={`svc-${b._id}`} className="cr-svc-card" style={{position:"relative",transition:"box-shadow .3s"}}>
                      {isAuction&&(
                        <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",fontSize:11,fontWeight:700,borderRadius:"10px 10px 0 0",padding:"6px 14px",margin:"-18px -18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <span>🔨 OPEN AUCTION</span>
                          {deadline&&<span style={{opacity:.8,fontSize:10}}>{deadlineLabel}</span>}
                        </div>
                      )}
                      <div className="cr-svc-card-name">{b.company}</div>
                      <div className="cr-svc-card-desc">{cleanDesc}</div>

                      {/* Price / floor */}
                      <div className="cr-svc-footer">
                        <div>
                          {isAuction
                            ?<div>
                               <div style={{fontSize:11,color:"var(--muted)",marginBottom:2}}>Floor price</div>
                               <div className="cr-svc-price">{hidePricesFromPublic?"🔒 Price hidden":"$"+b.amount.toLocaleString()}</div>
                             </div>
                            :(brandsOnly||hidePricesFromPublic)
                              ?<div>
                                 <div className="cr-svc-price-hidden">🔒 {brandsOnly?"Verified brands only":"Price hidden"}</div>
                                 <div style={{fontSize:11,color:"var(--muted)"}}>
                                   {brandsOnly?"Price unlocks after verification":"Contact creator for pricing"}
                                 </div>
                               </div>
                              :<div className="cr-svc-price">${b.amount.toLocaleString()}</div>
                          }
                        </div>
                        {!isOwner&&!deadlinePassed&&(
                          isAuction
                            ?<button className="cr-buy-btn" onClick={()=>setAuctionOpen(b._id)}>
                               {brandsOnly?"🔒 Place Bid":"🔨 Place Bid"}
                             </button>
                            :<button className="cr-buy-btn" onClick={()=>{
                               if(profile?.paymentMode==="self"){
                                 setPayTarget({...b,_selfPayment:true});
                               } else {
                                 setPayTarget(b);
                               }
                             }}>
                               {brandsOnly?"🔒 Verify & Book":"Book →"}
                             </button>
                        )}
                        {!isOwner&&deadlinePassed&&isAuction&&(
                          <span style={{fontSize:12,color:"var(--muted)",fontStyle:"italic"}}>Auction closed</span>
                        )}
                      </div>

                      {/* Owner controls */}
                      {isOwner&&(
                        <div style={{borderTop:"1px solid var(--border)",marginTop:10,paddingTop:10}}>
                          {/* Auction toggle row */}
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:isAuction?10:0}}>
                            <span style={{fontSize:12,color:"var(--muted)",fontWeight:600}}>🔨 Auction mode</span>
                            <div onClick={toggleAuctionOnProfile}
                              style={{width:36,height:20,borderRadius:100,background:isAuction?"var(--accent)":"var(--border)",position:"relative",cursor:"pointer",transition:"background .15s",flexShrink:0}}>
                              <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:isAuction?18:2,transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                            </div>
                          </div>

                          {/* Auction settings — shown when auction is on */}
                          {isAuction&&(
                            <div style={{display:"flex",flexDirection:"column",gap:7}}>
                              {/* Floor price */}
                              <div>
                                <div style={{fontSize:11,color:"var(--muted)",marginBottom:3}}>Floor price ($)</div>
                                <input type="number" inputMode="numeric"
                                  defaultValue={b.amount}
                                  onBlur={e=>{
                                    const v=Number(e.target.value);
                                    if(v!==b.amount) saveAuction(b.description,b.auctionDeadline,v);
                                  }}
                                  style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:7,padding:"6px 10px",fontSize:13,fontFamily:"'Inter',sans-serif",outline:"none"}}/>
                              </div>
                              {/* Deadline */}
                              <div>
                                <div style={{fontSize:11,color:"var(--muted)",marginBottom:3}}>Auction deadline</div>
                                <input type="datetime-local"
                                  defaultValue={deadline?deadline.toISOString().slice(0,16):""}
                                  onBlur={e=>{
                                    const v=e.target.value;
                                    saveAuction(b.description,v||null,b.amount);
                                  }}
                                  style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:7,padding:"6px 10px",fontSize:13,fontFamily:"'Inter',sans-serif",outline:"none"}}/>
                                {deadline&&<div style={{fontSize:11,color:deadlinePassed?"var(--red)":"var(--accent)",marginTop:3,fontWeight:600}}>{deadlineLabel}</div>}
                              </div>
                              {/* View bids button */}
                              <button
                                onClick={()=>setAuctionOpen(b._id)}
                                style={{background:"var(--accent-lt)",color:"var(--accent)",border:"1.5px solid var(--accent)",borderRadius:8,padding:"7px 12px",fontSize:12.5,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",textAlign:"center"}}>
                                📊 View all bids
                              </button>
                            </div>
                          )}

                          {/* Edit / Delete / Share row */}
                          <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}>
                            <button onClick={()=>{setEditingSvc(b);setEditSvcForm({name:b.company,price:b.amount,desc:cleanDesc});}}
                              style={{flex:1,background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.3)",borderRadius:8,padding:"6px 8px",fontSize:12,fontWeight:600,color:"var(--accent)",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                              ✏️ Edit
                            </button>
                            <button onClick={()=>{
                                const svcUrl=`${window.location.origin}/referral/${profile.username}/service/${b._id}`;
                                navigator.clipboard.writeText(svcUrl);
                                showToast("Service link copied!","success");
                              }}
                              style={{flex:1,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.12)",borderRadius:8,padding:"6px 8px",fontSize:12,fontWeight:600,color:"rgba(255,255,255,.5)",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                              🔗 Share
                            </button>
                            <button onClick={()=>deleteSvc(b._id)} disabled={deletingId===b._id}
                              style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:600,color:"#f87171",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                              {deletingId===b._id?"…":"🗑"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
          </>
        )}
      </div>

      {/* Auction modal — bidding for visitors, bids panel for owner */}
      {auctionOpen&&(()=>{
        const auctionBounty=bounties.find(b=>b._id===auctionOpen);
        const brandsOnly=auctionBounty?.description?.includes("[brands-only]");
        const deadline=auctionBounty?.auctionDeadline?new Date(auctionBounty.auctionDeadline):null;
        return(
        <div className="pay-overlay" onClick={e=>e.target===e.currentTarget&&setAuctionOpen(null)}>
          <div className="pay-modal" style={{maxWidth:480}}>
            <button className="pay-close" onClick={()=>setAuctionOpen(null)}>✕</button>

            {/* OWNER: bids panel */}
            {isOwner?(
              <AuctionBidsPanel
                bountyId={auctionOpen}
                bounty={auctionBounty}
                token={currentUser?.token}
                onClose={()=>setAuctionOpen(null)}
                onDecide={(accId,decision)=>{
                  fetch(`${API}/acceptance/${accId}/decision`,{method:"PATCH",
                    headers:{"Content-Type":"application/json","Authorization":`Bearer ${currentUser?.token}`},
                    body:JSON.stringify({decision})})
                  .then(r=>r.json()).then(d=>{
                    if(d.success){setAuctionOpen(null);window.location.reload();}
                  });
                }}
              />
            ):(
              /* VISITOR: place bid */
              auctionDone?(
                <div style={{textAlign:"center",padding:"24px 0"}}>
                  <div style={{fontSize:52,marginBottom:12}}>🔨</div>
                  <div style={{fontFamily:"Instrument Serif",fontSize:24,marginBottom:8}}>Bid placed!</div>
                  <div style={{fontSize:14,color:"var(--muted)",lineHeight:1.7,marginBottom:8}}>
                    @{profile.username} will review all bids
                    {deadline&&<> — auction closes <strong>{deadline.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</strong></>}.
                  </div>
                  <div style={{fontSize:13,color:"var(--muted)",marginBottom:20}}>The winner will be contacted by email.</div>
                  <button className="pay-submit" onClick={()=>{setAuctionOpen(null);setAuctionDone(false);setBrandVerifStep("email");setBrandBizEmail("");setBrandOtpCode("");}}>Close</button>
                </div>
              ):(
                <div>
                  {/* Header */}
                  <div style={{textAlign:"center",marginBottom:14,paddingTop:4}}>
                    <div style={{fontSize:26,marginBottom:6}}>🔨</div>
                    <div style={{fontFamily:"Instrument Serif",fontSize:21,marginBottom:3}}>{auctionBounty?.company}</div>
                    <div style={{fontSize:12.5,color:"var(--muted)"}}>Auction by @{profile.username}</div>
                    {auctionBounty?.amount>0&&<div style={{marginTop:5,fontSize:13,color:"var(--accent)",fontWeight:600}}>Floor: ${auctionBounty.amount.toLocaleString()}</div>}
                    {deadline&&<div style={{marginTop:3,fontSize:12,color:deadline<new Date()?"var(--red)":"var(--muted)"}}>{deadline<new Date()?"⚠ Auction closed":"⏱ Closes "+deadline.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>}
                  </div>
                  <div style={{height:1,background:"var(--border)",margin:"0 0 14px"}}/>

                  {/* BRAND VERIFICATION GATE */}
                  {brandsOnly&&brandVerifStep!=="verified"?(
                    <div>
                      <div style={{background:"#f5f3ff",border:"1.5px solid #ede9fe",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
                        <div style={{fontWeight:700,fontSize:14,color:"#4c1d95",marginBottom:4}}>🔒 Verified brands only</div>
                        <div style={{fontSize:13,color:"#6d28d9",lineHeight:1.5}}>
                          {brandVerifStep==="email"
                            ?"Enter your business email to unlock bidding. Personal emails (Gmail, Yahoo etc.) are not accepted."
                            :`Code sent to ${brandBizEmail} — enter it below.`}
                        </div>
                      </div>

                      {brandVerifErr&&<div style={{color:"var(--red)",fontSize:12.5,marginBottom:10,background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"8px 12px"}}>⚠ {brandVerifErr}</div>}

                      {brandVerifStep==="email"&&(
                        <>
                          <input className="pay-field" type="email"
                            placeholder="you@yourcompany.com"
                            value={brandBizEmail}
                            autoFocus
                            onChange={e=>{setBrandBizEmail(e.target.value);setBrandVerifErr("");}}/>
                          <button className="pay-submit" disabled={!brandBizEmail||brandVerifLoading}
                            onClick={()=>{
                              setBrandVerifLoading(true);setBrandVerifErr("");
                              fetch(`${API}/brand/send-otp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:brandBizEmail})})
                                .then(r=>r.json())
                                .then(d=>{if(d.success)setBrandVerifStep("code");else setBrandVerifErr(d.error||"Failed to send code");})
                                .catch(()=>setBrandVerifErr("Network error"))
                                .finally(()=>setBrandVerifLoading(false));
                            }}>
                            {brandVerifLoading?"Sending…":"Send Verification Code →"}
                          </button>
                        </>
                      )}

                      {brandVerifStep==="code"&&(
                        <>
                          <input className="pay-field" placeholder="000000"
                            value={brandOtpCode} maxLength={6} inputMode="numeric" autoFocus
                            onChange={e=>{setBrandOtpCode(e.target.value.replace(/\D/g,"").slice(0,6));setBrandVerifErr("");}}
                            style={{textAlign:"center",fontSize:22,letterSpacing:8,fontWeight:700}}/>
                          <button className="pay-submit" disabled={brandOtpCode.length!==6||brandVerifLoading}
                            onClick={()=>{
                              setBrandVerifLoading(true);setBrandVerifErr("");
                              fetch(`${API}/brand/verify-otp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:brandBizEmail,code:brandOtpCode})})
                                .then(r=>r.json())
                                .then(d=>{if(d.success&&d.verified)setBrandVerifStep("verified");else setBrandVerifErr(d.error||"Incorrect code");})
                                .catch(()=>setBrandVerifErr("Network error"))
                                .finally(()=>setBrandVerifLoading(false));
                            }}>
                            {brandVerifLoading?"Verifying…":"Verify & Unlock Bidding →"}
                          </button>
                          <div style={{textAlign:"center",marginTop:8,fontSize:12,color:"var(--muted)"}}>
                            <button style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:12}}
                              onClick={()=>{setBrandVerifStep("email");setBrandOtpCode("");setBrandVerifErr("");}}>
                              ← Different email
                            </button>
                            {" · "}
                            <button style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:12}}
                              onClick={()=>{
                                setBrandVerifLoading(true);
                                fetch(`${API}/brand/send-otp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:brandBizEmail})})
                                  .finally(()=>setBrandVerifLoading(false));
                              }}>Resend code</button>
                          </div>
                        </>
                      )}
                    </div>
                  ):(
                    /* BID FORM */
                    <>
                      {brandsOnly&&brandVerifStep==="verified"&&(
                        <div style={{display:"flex",alignItems:"center",gap:8,background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:10,padding:"9px 13px",marginBottom:12}}>
                          <span>✅</span>
                          <div>
                            <div style={{fontWeight:700,fontSize:13,color:"#166534"}}>Brand verified</div>
                            <div style={{fontSize:12,color:"#16a34a"}}>{brandBizEmail}</div>
                          </div>
                        </div>
                      )}
                      <input className="pay-field" placeholder="Your name / company" value={auctionBidder} onChange={e=>setAuctionBidder(e.target.value)}/>
                      <input className="pay-field" type="email" placeholder="Email (for winner contact)" value={auctionEmail} onChange={e=>setAuctionEmail(e.target.value)}/>
                      <div style={{position:"relative",marginBottom:10}}>
                        <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:16,fontWeight:700,color:"var(--muted)"}}>$</span>
                        <input className="pay-field" type="number" inputMode="numeric"
                          placeholder={`Min $${(auctionBounty?.amount||0).toLocaleString()}`}
                          value={auctionBid} onChange={e=>setAuctionBid(e.target.value)}
                          style={{paddingLeft:28,marginBottom:0}}/>
                      </div>
                      {auctionBid&&auctionBounty?.amount>0&&Number(auctionBid)<auctionBounty.amount&&(
                        <div style={{color:"var(--red)",fontSize:12.5,marginBottom:10}}>⚠ Bid must be at least ${auctionBounty.amount.toLocaleString()}</div>
                      )}
                      <button className="pay-submit" onClick={submitAuctionBid}
                        disabled={!auctionBidder||!auctionEmail||!auctionBid||(auctionBounty?.amount>0&&Number(auctionBid)<auctionBounty.amount)}>
                        🔨 Submit Bid →
                      </button>
                      <div style={{textAlign:"center",marginTop:8,fontSize:12,color:"var(--muted)"}}>
                        Bidding does not charge you. The creator picks the winner.
                      </div>
                    </>
                  )}
                </div>
              )
            )}
          </div>
        </div>
        );
      })()}

      {/* ── EDIT SERVICE MODAL ── */}
      {editingSvc&&(
        <div className="pay-overlay" onClick={e=>e.target===e.currentTarget&&setEditingSvc(null)}>
          <div className="pay-modal" style={{maxWidth:440}}>
            <button className="pay-close" onClick={()=>setEditingSvc(null)}>✕</button>
            <div style={{fontFamily:"Instrument Serif",fontSize:22,marginBottom:4}}>Edit Service</div>
            <div style={{fontSize:13,color:"var(--muted)",marginBottom:18}}>Changes go live immediately on your profile.</div>

            <div style={{marginBottom:12}}>
              <label style={{fontSize:12.5,fontWeight:600,color:"var(--muted)",display:"block",marginBottom:5}}>Service name</label>
              <input className="pay-field" value={editSvcForm.name||""} onChange={e=>setEditSvcForm(f=>({...f,name:e.target.value}))}
                placeholder="e.g. Sponsored Post"/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12.5,fontWeight:600,color:"var(--muted)",display:"block",marginBottom:5}}>Description</label>
              <textarea className="pay-field" value={editSvcForm.desc||""} onChange={e=>setEditSvcForm(f=>({...f,desc:e.target.value}))}
                placeholder="Describe what's included…"
                style={{resize:"vertical",minHeight:80}}/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{fontSize:12.5,fontWeight:600,color:"var(--muted)",display:"block",marginBottom:5}}>Price ($)</label>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:15,fontWeight:700,color:"var(--muted)"}}>$</span>
                <input className="pay-field" type="number" inputMode="numeric" value={editSvcForm.price||""} onChange={e=>setEditSvcForm(f=>({...f,price:e.target.value}))}
                  placeholder="0" style={{paddingLeft:28}}/>
              </div>
            </div>

            <div style={{display:"flex",gap:8}}>
              <button className="pay-submit" onClick={saveEditSvc} disabled={savingSvc||!editSvcForm.name}>
                {savingSvc?"Saving…":"✅ Save changes"}
              </button>
            </div>

            {/* Share link */}
            <div style={{marginTop:16,padding:"10px 14px",background:"var(--cream)",borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,fontSize:12,fontFamily:"monospace",color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {window.location.origin}/referral/{profile.username}/service/{editingSvc._id}
              </div>
              <button style={{background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",flexShrink:0}}
                onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/referral/${profile.username}/service/${editingSvc._id}`);showToast("Link copied!","success");}}>
                🔗 Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {payTarget&&<PayModal service={payTarget} profileUsername={profile.username} onClose={()=>setPayTarget(null)}/>}
    </div>
  );
}

// ── Auction Bids Panel (owner view) ──────────────────────────────────────────
function AuctionBidsPanel({bountyId, bounty, token, onClose, onDecide}){
  const [bids,setBids]=useState([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    fetch(`${API}/bounty/${bountyId}/bids`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.json())
      .then(d=>{if(d.success) setBids(d.bids||[]);})
      .finally(()=>setLoading(false));
  },[bountyId]);

  const deadline=bounty?.auctionDeadline?new Date(bounty.auctionDeadline):null;
  const closed=deadline&&deadline<new Date();

  return(
    <div>
      <div style={{textAlign:"center",marginBottom:16,paddingTop:4}}>
        <div style={{fontSize:22,fontWeight:700,marginBottom:4}}>🔨 {bounty?.company}</div>
        <div style={{fontSize:13,color:"var(--muted)"}}>Auction bids — {bids.length} received</div>
        {deadline&&(
          <div style={{marginTop:6,fontSize:12.5,fontWeight:600,color:closed?"var(--red)":"var(--accent)"}}>
            {closed?"Auction closed":"⏱ Closes "+deadline.toLocaleDateString('en-US',{month:'short',day:'numeric'})+" · "+deadline.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
          </div>
        )}
        {bounty?.amount>0&&<div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>Floor: ${bounty.amount.toLocaleString()}</div>}
      </div>
      <div style={{height:1,background:"var(--border)",margin:"0 0 14px"}}/>
      {loading?<div style={{textAlign:"center",padding:20,color:"var(--muted)"}}>Loading bids…</div>
      :bids.length===0?<div style={{textAlign:"center",padding:20,color:"var(--muted)"}}>No bids yet.</div>
      :<div style={{maxHeight:340,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
        {bids.map((bid,idx)=>(
          <div key={bid._id} style={{
            border:`1.5px solid ${idx===0?"var(--accent)":"var(--border)"}`,
            borderRadius:10,padding:"12px 14px",
            background:idx===0?"var(--accent-lt)":"var(--card)",
          }}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div>
                {idx===0&&<div style={{fontSize:10,fontWeight:700,color:"var(--accent)",marginBottom:3,textTransform:"uppercase",letterSpacing:".06em"}}>🏆 Highest bid</div>}
                <div style={{fontWeight:700,fontSize:14}}>{bid.name}</div>
                <div style={{fontSize:12,color:"var(--muted)"}}>{bid.email}</div>
                <div style={{fontFamily:"'Instrument Serif',serif",fontSize:22,color:"var(--accent)",marginTop:2}}>${bid.amount.toLocaleString()}</div>
              </div>
              {bid.status==="pending"&&(
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <button className="btn btn-green btn-sm" onClick={()=>onDecide(bid._id,"accepted")}>✓ Select Winner</button>
                  <button className="btn btn-ghost btn-xs" onClick={()=>onDecide(bid._id,"rejected")}>✕ Decline</button>
                </div>
              )}
              {bid.status==="working"&&<span style={{fontSize:12,color:"var(--green)",fontWeight:700}}>✓ Winner selected</span>}
              {bid.status==="rejected"&&<span style={{fontSize:11,color:"var(--muted)"}}>Declined</span>}
            </div>
          </div>
        ))}
      </div>}
      <div style={{marginTop:14,fontSize:12,color:"var(--muted)",textAlign:"center",lineHeight:1.6}}>
        Selecting a winner notifies them by email and marks them as accepted.<br/>
        Other bids will be automatically declined.
      </div>
    </div>
  );
}

function ShareBar({url, showToast}){
  const [copied,setCopied]=useState(false);
  const copy=()=>{
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast("Link copied! Share it everywhere 🚀","success");
    setTimeout(()=>setCopied(false),2500);
  };
  const enc=encodeURIComponent(url);
  const msg=encodeURIComponent("Check out my TrueBounty page — I'm paying for real help with referrals, intros & more:");
  const networks=[
    {label:"Twitter / X", icon:"𝕏", color:"#000", href:`https://twitter.com/intent/tweet?text=${msg}&url=${enc}`},
    {label:"LinkedIn",    icon:"in", color:"#0077b5", href:`https://www.linkedin.com/sharing/share-offsite/?url=${enc}`},
    {label:"WhatsApp",    icon:"💬", color:"#25d366", href:`https://wa.me/?text=${msg}%20${enc}`},
    {label:"Email",       icon:"✉️", color:"#555",    href:`mailto:?subject=Check out my TrueBounty page&body=${msg}%20${url}`},
  ];
  return(
    <div style={{marginTop:16}}>
      {/* Main share bar */}
      <div className="share-bar">
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>🔗 Your bounty page link</div>
          <div className="share-url-box">{url}</div>
        </div>
        <button className={`share-copy-btn ${copied?"copied":""}`} onClick={copy}>
          {copied?"✓ Copied!":"Copy Link"}
        </button>
      </div>
      {/* Network buttons */}
      <div style={{marginTop:10}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginBottom:8,fontWeight:600,textTransform:"uppercase",letterSpacing:".07em"}}>Share to</div>
        <div className="share-networks">
          {networks.map(n=>(
            <a key={n.label} href={n.href} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
              <div className="share-net-btn" style={{borderColor:n.color+"33"}}>
                <span style={{fontWeight:800,color:n.color,fontSize:14,lineHeight:1}}>{n.icon}</span>
                <span>{n.label}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function PublicPage({username,serviceId,currentUser,onNavigate,showToast,onProfileLoad}){
  const [profile,setProfile]=useState(null);
  const [bounties,setBounties]=useState([]);
  const [loading,setLoading]=useState(true);
  const [acceptTarget,setAcceptTarget]=useState(null);
  const [getPaidTarget,setGetPaidTarget]=useState(null);
  const [suggestOpen,setSuggestOpen]=useState(false);
  const [addOpen,setAddOpen]=useState(false);
  const [newB,setNewB]=useState({company:"",category:"",amount:"",description:""});
  const [liveAcceptances,setLiveAcceptances]=useState({});
  const [checkingStatus,setCheckingStatus]=useState(false);
  const [highlightedSvc,setHighlightedSvc]=useState(serviceId||null);

  const isOwner=currentUser?.username===username;

  // Auto-scroll to highlighted service after load
  useEffect(()=>{
    if(!highlightedSvc||loading) return;
    setTimeout(()=>{
      const el=document.getElementById(`svc-${highlightedSvc}`);
      if(el){
        el.scrollIntoView({behavior:"smooth",block:"center"});
        el.style.transition="box-shadow .3s";
        el.style.boxShadow="0 0 0 3px #6366f1, 0 0 32px rgba(99,102,241,.4)";
        setTimeout(()=>{el.style.boxShadow="";setHighlightedSvc(null);},2500);
      }
    },600);
  },[highlightedSvc,loading]);

  useEffect(()=>{load();},[username]);

  const load=async()=>{
    setLoading(true);
    try{
      const ownParam = currentUser?.username===username ? '?own=1' : '';
      const r=await fetch(`${API}/profile/${username}${ownParam}`);
      const d=await r.json();
      if(d.success){
        setProfile(d.user);setBounties(d.bounties||[]);
        if(onProfileLoad) onProfileLoad(d.user.username, d.user.categories);
      }
    }catch{}
    setLoading(false);
  };

  // fetchMyStatuses defined before the useEffect that calls it
  const fetchMyStatuses=useCallback(async(email)=>{
    if(!email) return;
    setCheckingStatus(true);
    try{
      const r=await fetch(`${API}/my-acceptances?email=${encodeURIComponent(email)}`);
      const d=await r.json();
      if(d.success){
        // Key by bounty id — handle both populated object and raw id string
        const map={};
        d.acceptances.forEach(a=>{
          const bid = a.bounty?._id ? String(a.bounty._id) : String(a.bounty);
          map[bid]=a;
        });
        setLiveAcceptances(map);
      }
    }catch{}
    setCheckingStatus(false);
  },[]);

  // On mount, fetch live statuses — use logged-in email first, then localStorage fallback
  useEffect(()=>{
    if(isOwner) return;
    // Logged-in user → always use their account email (most reliable)
    const email = currentUser?.email || localStorage.getItem("myEmail");
    if(email){
      // Cache it so the status bar renders correctly
      if(!localStorage.getItem("myEmail") && email) localStorage.setItem("myEmail", email);
      fetchMyStatuses(email);
    }
  },[username,isOwner,fetchMyStatuses,currentUser?.email]);

  const handleAccept=async(bountyId,form)=>{
    try{
      const r=await fetch(`${API}/bounty/${bountyId}/accept`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const d=await r.json();
      if(d.success){
        showToast("Application sent! Check your email for confirmation.","success");
        setAcceptTarget(null);
        // Save email so we can fetch statuses next visit
        localStorage.setItem("myEmail",form.email);
        // Update live acceptances immediately
        setLiveAcceptances(prev=>({...prev,[bountyId]:d.acceptance}));
      }else showToast(d.error||"Error","error");
    }catch{showToast("Network error","error");}
  };

  const handleGetPaid=async(acc,form)=>{
    try{
      const r=await fetch(`${API}/acceptance/${acc._id}/claim-payment`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const d=await r.json();
      if(d.success){
        showToast("Payment claim submitted! We'll verify within 24h.","success");
        setGetPaidTarget(null);
        // Refresh statuses
        const email=localStorage.getItem("myEmail");
        if(email) fetchMyStatuses(email);
      }else showToast(d.error||"Error","error");
    }catch{showToast("Network error","error");}
  };

  const handleSuggest=async(form)=>{
    try{
      const r=await fetch(`${API}/profile/${username}/suggest`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const d=await r.json();
      if(d.success){showToast("Suggestion submitted!","success");setSuggestOpen(false);load();}
      else showToast(d.error||"Error","error");
    }catch{showToast("Network error","error");}
  };

  const handleAddBounty=async()=>{
    if(!newB.company||!newB.category||!newB.amount) return;
    try{
      const r=await fetch(`${API}/bounty`,{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${currentUser?.token}`},body:JSON.stringify(newB)});
      const d=await r.json();
      if(d.success){showToast("Bounty added!","success");setAddOpen(false);setNewB({company:"",category:"",amount:"",description:""});load();}
      else showToast(d.error||"Error","error");
    }catch{showToast("Network error","error");}
  };

  const [emailLookup,setEmailLookup]=useState("");
  const [showLookup,setShowLookup]=useState(false);

  if(loading) return <div className="profile-wrap"><div className="empty"><div className="icon">⏳</div><p>Loading…</p></div></div>;
  if(!profile) return <div className="profile-wrap"><div className="empty"><div className="icon">🔍</div><p>Profile not found.</p><button className="btn btn-primary" style={{marginTop:16}} onClick={()=>onNavigate("home")}>Go home</button></div></div>;

  const active=bounties.filter(b=>b.status!=="suggested"&&b.status!=="rejected");
  const suggested=bounties.filter(b=>b.status==="suggested");
  const initials=(profile.username||"?").slice(0,2).toUpperCase();

  // Detect creator profile — has creator-type categories or [brands-only] services
  const backendCreatorCats=["influencer","content","podcast_guest","beta_users","advisor","engineering","design_help","marketing","sales_lead","fundraising"];
  const isCreatorProfile=(
    active.some(b=>b.description?.includes("[brands-only]")) ||
    (active.length>0 && active.every(b=>backendCreatorCats.includes(b.category)))
  );

  // Render creator profile view
  if(isCreatorProfile){
    return(
      <CreatorProfileView
        profile={profile} bounties={bounties} isOwner={isOwner}
        currentUser={currentUser} onNavigate={onNavigate} showToast={showToast}
      />
    );
  }

  // Only show status badge for accepted (working/payment_requested/paid) — not pending
  // "pending" is internal — visitor shouldn't see their application is in limbo
  const statusLabel={
    working:           {text:"✅ Accepted! Now do the work", cls:"working"},
    payment_requested: {text:"💸 Payment claim submitted",  cls:"payment_requested"},
    paid:              {text:"💰 Paid!",                    cls:"paid"},
    rejected:          {text:"❌ Not accepted this time",   cls:"rejected"},
  };

  return(
    <div className="profile-wrap">
      <div className="profile-hero">
        <div className="p-inner">
          <div className="p-top">
            <div className="p-av" style={{overflow:"hidden",padding:0}}>
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} onError={e=>e.target.style.display="none"}/>
                : initials}
            </div>
            <div style={{flex:1}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(99,102,241,.18)",border:"1px solid rgba(99,102,241,.3)",borderRadius:100,padding:"4px 12px",fontSize:11,fontWeight:700,color:"#a5b4fc",letterSpacing:".06em",marginBottom:10}}>
                🎯 BOUNTY PAGE
              </div>
              <div className="p-name">@{profile.username}</div>
              {profile.categories?.length>0&&(
                <div className="p-tags">
                  {profile.categories.map(c=><span key={c} className="p-tag">{CAT[c]?.icon} {CAT[c]?.label||c}</span>)}
                </div>
              )}
              <div className="p-links">
                {profile.linkedinProfile&&<a href={profile.linkedinProfile} target="_blank" rel="noreferrer">🔗 LinkedIn</a>}
              </div>
              {profile.customFields?.length>0&&(
                <div className="p-cust">
                  {profile.customFields.map((f,i)=>(
                    <div key={i} className="p-cr"><span className="p-ck">{f.fieldName}:</span><span className="p-cv">{f.answer}</span></div>
                  ))}
                </div>
              )}
              <ShareBar url={window.location.href} showToast={showToast}/>
            </div>
            {isOwner&&<button className="btn btn-secondary btn-sm" onClick={()=>onNavigate("dashboard")}>Dashboard →</button>}
          </div>
        </div>
      </div>

      {/* ── Helper status bar ── */}
      {!isOwner&&(
        <div style={{background:"rgba(99,102,241,.07)",borderBottom:"1px solid var(--border)"}}>
          <div style={{maxWidth:900,margin:"0 auto",padding:"12px 20px"}}>

            {/* Email known — show live status for all their applications on this page */}
            {localStorage.getItem("myEmail")&&(()=>{
              const myApps=Object.values(liveAcceptances);
              const accepted=myApps.filter(a=>a.status==="working");
              const paid=myApps.filter(a=>a.status==="paid");
              const claimed=myApps.filter(a=>a.status==="payment_requested");
              const pending=myApps.filter(a=>a.status==="pending");

              if(myApps.length===0 && !checkingStatus) return(
                <div style={{fontSize:13,color:"var(--muted)"}}>
                  No applications found for <strong>{localStorage.getItem("myEmail")}</strong>.{" "}
                  <span style={{color:"var(--accent)",cursor:"pointer"}} onClick={()=>{localStorage.removeItem("myEmail");setLiveAcceptances({});}}>Use different email</span>
                </div>
              );

              return(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {checkingStatus&&<div style={{fontSize:13,color:"var(--muted)"}}>⏳ Checking your applications…</div>}

                  {/* Accepted — show prominent alert + Get Paid per bounty */}
                  {accepted.map(a=>{
                    const b=bounties.find(bx=>String(bx._id)===String(a.bounty?._id||a.bounty));
                    return(
                      <div key={a._id} style={{background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                        <span style={{fontSize:18}}>🎉</span>
                        <div style={{flex:1,minWidth:180}}>
                          <div style={{fontWeight:700,fontSize:14,color:"#15803d"}}>Your application was accepted!</div>
                          <div style={{fontSize:13,color:"#16a34a",marginTop:1}}>
                            {b?<><strong>{b.company}</strong> · ${b.amount}</>:<>Bounty #{String(a.bounty?._id||a.bounty).slice(-6)}</>}
                            {" "}— Go complete the task, then claim your payment below.
                          </div>
                        </div>
                        <button className="btn btn-green" onClick={()=>setGetPaidTarget(a)}>💸 Get Paid</button>
                      </div>
                    );
                  })}

                  {/* Claimed */}
                  {claimed.map(a=>{
                    const b=bounties.find(bx=>String(bx._id)===String(a.bounty?._id||a.bounty));
                    return(
                      <div key={a._id} style={{background:"var(--purple-lt)",border:"1.5px solid #c4b5fd",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                        <span style={{fontSize:18}}>💸</span>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:14,color:"var(--purple)"}}>Payment claim submitted</div>
                          <div style={{fontSize:13,color:"var(--purple)",marginTop:1}}>
                            {b?<><strong>{b.company}</strong> · ${b.amount}</>:"Bounty"} — Our admin is verifying your claim. Usually within 24h.
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Paid */}
                  {paid.map(a=>{
                    const b=bounties.find(bx=>String(bx._id)===String(a.bounty?._id||a.bounty));
                    return(
                      <div key={a._id} style={{background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:18}}>💰</span>
                        <div style={{fontWeight:700,fontSize:14,color:"#15803d"}}>Paid! {b?`$${b.amount} for ${b.company}`:""}</div>
                      </div>
                    );
                  })}

                  {/* Pending only — no accepted ones yet */}
                  {accepted.length===0&&claimed.length===0&&paid.length===0&&pending.length>0&&(
                    <div style={{background:"var(--gold-lt)",border:"1.5px solid #fcd34d",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                      <span style={{fontSize:18}}>⏳</span>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:14,color:"var(--gold)"}}>Application pending review</div>
                        <div style={{fontSize:13,color:"#92400e",marginTop:1}}>
                          You've applied to {pending.length} bounty{pending.length>1?"s":""} on this page. The owner will review and accept or decline soon.
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={()=>fetchMyStatuses(localStorage.getItem("myEmail"))}>↻ Refresh</button>
                    </div>
                  )}

                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <span style={{fontSize:11.5,color:"var(--muted)",cursor:"pointer"}} onClick={()=>{localStorage.removeItem("myEmail");setLiveAcceptances({});}}>
                      Not you? Clear email
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* No email stored — show lookup */}
            {!localStorage.getItem("myEmail")&&(
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <span style={{fontSize:13,color:"var(--muted)"}}>Already applied? Check your status:</span>
                {!showLookup?(
                  <button className="btn btn-secondary btn-sm" onClick={()=>setShowLookup(true)}>Check status →</button>
                ):(
                  <>
                    <input className="input" style={{maxWidth:220,padding:"7px 11px",fontSize:13}} placeholder="Your email address" value={emailLookup}
                      onChange={e=>setEmailLookup(e.target.value)}
                      onKeyDown={e=>e.key==="Enter"&&emailLookup&&(localStorage.setItem("myEmail",emailLookup),fetchMyStatuses(emailLookup),setShowLookup(false))}
                    />
                    <button className="btn btn-primary btn-sm" onClick={()=>{
                      if(emailLookup){localStorage.setItem("myEmail",emailLookup);fetchMyStatuses(emailLookup);setShowLookup(false);}
                    }}>Check</button>
                    <button className="btn btn-ghost btn-sm" onClick={()=>setShowLookup(false)}>Cancel</button>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      <div className="b-area">
        {isOwner&&(
          <div style={{marginBottom:22}}>
            {!addOpen?(
              <button className="btn btn-accent" onClick={()=>setAddOpen(true)}>+ Add Bounty</button>
            ):(
              <div className="add-b-form">
                <div className="micro" style={{marginBottom:12}}>New Bounty</div>
                <div className="add-b-grid">
                  <div className="field" style={{margin:0}}><label className="label">Company</label><input className="input" placeholder="e.g. Google" value={newB.company} onChange={e=>setNewB(f=>({...f,company:e.target.value}))}/></div>
                  <div className="field" style={{margin:0}}>
                    <label className="label">Type</label>
                    <select className="select" value={newB.category} onChange={e=>setNewB(f=>({...f,category:e.target.value}))}>
                      <option value="">Select…</option>
                      {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                  </div>
                  <div className="field" style={{margin:0}}><label className="label">$ Amount</label><input className="input" type="number" placeholder="100" value={newB.amount} onChange={e=>setNewB(f=>({...f,amount:e.target.value}))}/></div>
                  <div style={{paddingBottom:1}}><button className="btn btn-accent" style={{height:40}} onClick={handleAddBounty}>Add</button></div>
                </div>
                <div className="field" style={{marginTop:8,marginBottom:10}}><label className="label">Description <span className="opt">(opt)</span></label><input className="input" placeholder="Add context…" value={newB.description} onChange={e=>setNewB(f=>({...f,description:e.target.value}))}/></div>
                <button className="btn btn-ghost btn-sm" onClick={()=>setAddOpen(false)}>Cancel</button>
              </div>
            )}
          </div>
        )}

        <div className="ba-head">
          <div className="ba-ttl">💰 Open Bounties <span className="b-cnt">{active.length}</span></div>
          {!isOwner&&<div style={{fontSize:13,color:"var(--muted)"}}>Help with any of these and get paid</div>}
        </div>

        {active.length===0
          ?<div className="empty"><div className="icon">🎯</div><p>No bounties yet.</p></div>
          :active.map(b=>{
            const cat=CAT[b.category];
            const myAcc=liveAcceptances[String(b._id)];
            return(
              <div key={b._id} className="b-card">
                <div className="b-left">
                  <span className="badge badge-neutral" style={{marginBottom:5}}>{cat?.icon||"📌"} {cat?.label||b.category}</span>
                  <div className="b-co">{b.company}</div>
                  {b.description&&<div className="b-desc">{b.description}</div>}
                </div>
                <div className="b-right">
                  <div className="b-amt">${b.amount}</div>
                  {!isOwner&&(
                    <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                      {myAcc&&myAcc.status!=="pending"?(
                        // Only show status badge once owner has responded
                        <>
                          <span className={`sb ${statusLabel[myAcc.status]?.cls||myAcc.status}`} style={{fontSize:11.5,textAlign:"right"}}>
                            {statusLabel[myAcc.status]?.text||myAcc.status}
                          </span>
                          {myAcc.status==="working"&&(
                            <button className="btn btn-gold btn-sm" style={{fontWeight:600}} onClick={()=>setGetPaidTarget(myAcc)}>
                              💸 Get Paid
                            </button>
                          )}
                          {myAcc.status==="payment_requested"&&(
                            <span style={{fontSize:11.5,color:"var(--purple)"}}>Awaiting verification</span>
                          )}
                        </>
                      ):myAcc&&myAcc.status==="pending"?(
                        // Applied but pending — show subtle "Applied" with no status exposed
                        <span style={{fontSize:12,color:"var(--muted)",fontStyle:"italic"}}>Applied ✓</span>
                      ):(
                        // Not applied yet
                        <button className="btn btn-accent btn-sm" onClick={()=>setAcceptTarget(b)}>
                          💼 I can deliver this →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        }

        {suggested.length>0&&<>
          <div className="ba-head" style={{marginTop:28}}>
            <div className="ba-ttl">Suggested Bounties <span className="b-cnt">{suggested.length}</span></div>
          </div>
          {suggested.map(b=>{
            const cat=CAT[b.category];
            return(
              <div key={b._id} className="b-card suggest">
                <div className="b-left">
                  <span className="badge badge-suggest" style={{marginBottom:5}}>✨ Suggested · {cat?.label||b.category}</span>
                  <div className="b-co">{b.company}</div>
                  {b.description&&<div className="b-desc">{b.description}</div>}
                </div>
                <div className="b-right">
                  <div className="b-amt">${b.amount}</div>
                  {isOwner&&<div style={{display:"flex",gap:5}}>
                    <button className="btn btn-green btn-xs">✓</button>
                    <button className="btn btn-ghost btn-xs">✕</button>
                  </div>}
                </div>
              </div>
            );
          })}
        </>}

        {!isOwner&&(
          <div className="suggest-bar">
            <p>Can you help with something not listed?</p>
            <button className="btn btn-secondary" onClick={()=>setSuggestOpen(true)}>💡 Suggest a Bounty</button>
          </div>
        )}
      </div>

      {acceptTarget&&<AcceptModal bounty={acceptTarget} onClose={()=>setAcceptTarget(null)} onSubmit={f=>handleAccept(acceptTarget._id,f)}/>}
      {getPaidTarget&&<GetPaidModal acceptance={getPaidTarget} onClose={()=>setGetPaidTarget(null)} onSubmit={f=>handleGetPaid(getPaidTarget,f)}/>}
      {suggestOpen&&<SuggestModal onClose={()=>setSuggestOpen(false)} onSubmit={handleSuggest}/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OWNER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
// Inline "Add Bounty" form used inside the Dashboard My Bounties tab
function AddBountyInline({token, onAdded}){
  const [open,setOpen]=useState(false);
  const [form,setForm]=useState({company:"",category:"",amount:"",description:""});
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const submit=async()=>{
    if(!form.company||!form.category||!form.amount) return;
    setSaving(true);
    try{
      const r=await fetch(`${API}/bounty`,{method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
        body:JSON.stringify({...form,amount:Number(form.amount)})});
      const d=await r.json();
      if(d.success){
        setForm({company:"",category:"",amount:"",description:""});
        setOpen(false);
        onAdded();
      }
    }finally{setSaving(false);}
  };

  if(!open) return(
    <div style={{marginBottom:18}}>
      <button className="btn btn-accent" onClick={()=>setOpen(true)}>+ Add Bounty</button>
    </div>
  );

  return(
    <div className="card" style={{padding:18,marginBottom:18,borderTop:"2px solid var(--accent)"}}>
      <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"var(--accent)",marginBottom:14}}>New Bounty</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div className="field" style={{margin:0}}>
          <label className="label">Company / Target</label>
          <input className="input" placeholder="e.g. Google" value={form.company} onChange={e=>set("company",e.target.value)}/>
        </div>
        <div className="field" style={{margin:0}}>
          <label className="label">Category</label>
          <select className="select" value={form.category} onChange={e=>set("category",e.target.value)}>
            <option value="">Select…</option>
            {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div className="field" style={{margin:0}}>
          <label className="label">Amount ($)</label>
          <input className="input" type="number" placeholder="100" value={form.amount} onChange={e=>set("amount",e.target.value)}/>
        </div>
        <div className="field" style={{margin:0}}>
          <label className="label">Description <span className="opt">(opt)</span></label>
          <input className="input" placeholder="What exactly do you need?" value={form.description} onChange={e=>set("description",e.target.value)}/>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>setOpen(false)}>Cancel</button>
        <button className="btn btn-accent" onClick={submit}
          disabled={saving||!form.company||!form.category||!form.amount}>
          {saving?"Adding…":"Add Bounty"}
        </button>
      </div>
    </div>
  );
}

function Dashboard({currentUser,onNavigate,showToast}){
  const [tab,setTab]=useState("requests");
  const [data,setData]=useState({bounties:[],accepted:[],suggested:[]});
  const [loading,setLoading]=useState(true);
  const [editingId,setEditingId]=useState(null);
  const [editForm,setEditForm]=useState({});
  const [saving,setSaving]=useState(false);
  const [deletingId,setDeletingId]=useState(null);
  const [payDetails,setPayDetails]=useState({method:"",handle:""});
  const [savingPay,setSavingPay]=useState(false);

  useEffect(()=>{load();},[]);
  const load=async()=>{
    setLoading(true);
    try{
      const r=await fetch(`${API}/dashboard`,{headers:{Authorization:`Bearer ${currentUser.token}`}});
      const d=await r.json();
      if(d.success) setData(d);
    }catch{}
    setLoading(false);
  };

  const startEdit=b=>{setEditingId(b._id);setEditForm({company:b.company,category:b.category,amount:b.amount,description:b.description||"",status:b.status});};
  const cancelEdit=()=>{setEditingId(null);setEditForm({});};
  const saveEdit=async id=>{
    setSaving(true);
    try{
      const r=await fetch(`${API}/bounty/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json","Authorization":`Bearer ${currentUser.token}`},body:JSON.stringify(editForm)});
      const d=await r.json();
      if(d.success){showToast("Updated!","success");setEditingId(null);load();}
      else showToast(d.error||"Error","error");
    }catch{showToast("Network error","error");}
    setSaving(false);
  };
  const deleteBounty=async id=>{
    if(!window.confirm("Delete this?")) return;
    setDeletingId(id);
    try{
      const r=await fetch(`${API}/bounty/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${currentUser.token}`}});
      const d=await r.json();
      if(d.success){showToast("Deleted","success");load();}
    }catch{}
    setDeletingId(null);
  };
  const decide=async(accId,decision)=>{
    try{
      const r=await fetch(`${API}/acceptance/${accId}/decision`,{method:"PATCH",headers:{"Content-Type":"application/json","Authorization":`Bearer ${currentUser.token}`},body:JSON.stringify({decision})});
      const d=await r.json();
      if(d.success){showToast(decision==="accepted"?"✅ Accepted!":"Declined","success");load();}
      else showToast(d.error||"Error","error");
    }catch{showToast("Network error","error");}
  };
  const claimPay=async accId=>{
    if(!payDetails.method||!payDetails.handle){showToast("Enter payment details first","error");return;}
    setSavingPay(true);
    try{
      const r=await fetch(`${API}/acceptance/${accId}/claim-payment`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({paymentMethod:payDetails.method,paymentHandle:payDetails.handle,completionNote:"Service delivered"})});
      const d=await r.json();
      if(d.success){showToast("💸 Payment claim submitted!","success");load();}
      else showToast(d.error||"Error","error");
    }catch{showToast("Network error","error");}
    setSavingPay(false);
  };
  const toggleAuction=async b=>{
    const isAuction=b.description?.includes("[auction]");
    const newDesc=isAuction
      ?b.description.replace(" [auction]","")
      :(b.description||"")+" [auction]";
    try{
      const r=await fetch(`${API}/bounty/${b._id}`,{method:"PATCH",headers:{"Content-Type":"application/json","Authorization":`Bearer ${currentUser.token}`},body:JSON.stringify({description:newDesc})});
      const d=await r.json();
      if(d.success){showToast(isAuction?"Auction off":"🔨 Auction mode on!","success");load();}
    }catch{showToast("Network error","error");}
  };

  const allAcc=data.accepted||[];
  const hiringRequests=allAcc.filter(a=>a.status==="pending");
  const activeOrders=allAcc.filter(a=>a.status==="working");
  const completedOrders=allAcc.filter(a=>a.status==="paid"||a.status==="payment_requested");

  // Detect profile type
  const CREATOR_BACKEND_CATS=["influencer","content","podcast_guest","beta_users","advisor","engineering","design_help","marketing","sales_lead","fundraising"];
  const isCreator=data.bounties?.length>0 && data.bounties.every(b=>CREATOR_BACKEND_CATS.includes(b.category)||b.description?.includes("[brands-only]"));
  const isMixed=data.bounties?.length>0 && !isCreator;

  const creatorTabs=[
    {id:"requests",label:"Hiring Requests",icon:"📩",count:hiringRequests.length},
    {id:"orders",  label:"Active Orders",  icon:"📦",count:activeOrders.length},
    {id:"getpaid", label:"Get Paid",       icon:"💸",count:completedOrders.length},
    {id:"services",label:"My Services",    icon:"✨",count:data.bounties?.length},
  ];
  const contractTabs=[
    {id:"applications",label:"Applications",icon:"✅",count:allAcc.length},
    {id:"bounties",    label:"My Bounties", icon:"🎯",count:data.bounties?.length},
    {id:"suggested",   label:"Suggested",  icon:"💡",count:data.suggested?.length},
  ];
  const activeTabs=isCreator?creatorTabs:contractTabs;
  const firstTab=activeTabs[0].id;
  // Reset tab if switching profile type
  const [_tab,_setTab]=useState(null);
  const effectiveTab=_tab&&activeTabs.find(t=>t.id===_tab)?_tab:firstTab;
  const setEffectiveTab=t=>{_setTab(t);};

  const cs={background:"rgba(255,255,255,.04)",border:"1px solid var(--border)",borderRadius:14,padding:"18px 20px",marginBottom:10};

  return(
    <div style={{background:"var(--paper)",minHeight:"calc(100vh - 56px)"}}>
      {/* Hero — purple for creator, dark for contract */}
      <div style={{background:isCreator?"linear-gradient(135deg,#1e1b4b,#312e81)":"var(--ink)",padding:"34px 22px 28px"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginBottom:3,textTransform:"uppercase",letterSpacing:".08em"}}>
            {isCreator?"✨ Creator Dashboard":"🎯 Bounty Dashboard"}
          </div>
          <div style={{fontFamily:"'Instrument Serif',serif",fontSize:24,color:"#fff",marginBottom:4}}>
            Hey, @{currentUser.username} 👋
          </div>
          {isCreator&&hiringRequests.length>0&&(
            <div style={{marginTop:10,background:"rgba(165,180,252,.15)",border:"1px solid rgba(165,180,252,.3)",borderRadius:10,padding:"10px 14px",fontSize:13.5,color:"#a5b4fc",display:"inline-flex",alignItems:"center",gap:8,cursor:"pointer"}}
              onClick={()=>setEffectiveTab("requests")}>
              📩 <strong>{hiringRequests.length}</strong> new hiring request{hiringRequests.length!==1?"s":""} waiting
            </div>
          )}
          {!isCreator&&allAcc.filter(a=>a.status==="pending").length>0&&(
            <div style={{marginTop:10,background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",borderRadius:10,padding:"10px 14px",fontSize:13.5,color:"#a5b4fc",display:"inline-flex",alignItems:"center",gap:8,cursor:"pointer"}}
              onClick={()=>setEffectiveTab("applications")}>
              🔔 <strong>{allAcc.filter(a=>a.status==="pending").length}</strong> applications pending review
            </div>
          )}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}>
            <button className="btn btn-secondary btn-sm" onClick={()=>onNavigate("profile",currentUser.username)}>
              {isCreator?"View Creator Page →":"View Bounty Page →"}
            </button>
            {currentUser.isAdmin&&<button className="btn btn-purple btn-sm" onClick={()=>onNavigate("admin")}>🛡️ Admin</button>}
            <button className="btn btn-ghost btn-sm" onClick={()=>{localStorage.removeItem("bountyUser");onNavigate("home");}}>Sign Out</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"28px 20px 60px"}}>
        <div style={{display:"flex",gap:2,flexWrap:"wrap",borderBottom:"2px solid var(--border)",marginBottom:24}}>
          {activeTabs.map(t=>(
            <button key={t.id} className={`d-tab ${effectiveTab===t.id?"active":""}`} onClick={()=>setEffectiveTab(t.id)}>
              {t.icon} {t.label} <span className="cnt">{t.count||0}</span>
            </button>
          ))}
        </div>

        {loading?<div className="empty"><div className="icon">⏳</div><p>Loading…</p></div>:<>

          {/* ── CREATOR: HIRING REQUESTS ── */}
          {isCreator&&effectiveTab==="requests"&&(
            hiringRequests.length===0
              ?<div className="empty"><div className="icon">📩</div><p>No hiring requests yet.</p><div style={{fontSize:13.5,color:"var(--muted)",marginTop:8}}>When brands book your services, they appear here.</div></div>
              :<div>
                <div style={{fontSize:13.5,color:"var(--muted)",marginBottom:16}}>{hiringRequests.length} request{hiringRequests.length!==1?"s":""} awaiting review</div>
                {hiringRequests.map(a=>(
                  <div key={a._id} style={cs}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
                      <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff",flexShrink:0}}>
                        {a.name?.[0]?.toUpperCase()||"?"}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:15}}>{a.name}</div>
                        <div style={{fontSize:13,color:"var(--muted)"}}>{a.email}</div>
                        <div style={{marginTop:8,padding:"8px 12px",background:"rgba(99,102,241,.07)",borderRadius:8}}>
                          <div style={{fontSize:12,fontWeight:600,color:"var(--muted)",marginBottom:2}}>Requested</div>
                          <div style={{fontWeight:700,fontSize:14}}>{a.bounty?.company}</div>
                          <div style={{fontSize:13,color:"var(--accent)",fontWeight:600}}>${a.bounty?.amount}</div>
                        </div>
                        {a.message&&<div style={{marginTop:8,fontSize:13.5,color:"var(--ink2)",fontStyle:"italic"}}>"{a.message}"</div>}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:7,flexShrink:0}}>
                        <button className="btn btn-green" onClick={()=>decide(a._id,"accepted")}>✓ Accept</button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>decide(a._id,"rejected")}>✕ Decline</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          )}

          {/* ── CREATOR: ACTIVE ORDERS ── */}
          {isCreator&&effectiveTab==="orders"&&(
            activeOrders.length===0
              ?<div className="empty"><div className="icon">📦</div><p>No active orders yet.</p></div>
              :<div>
                {activeOrders.map(a=>(
                  <div key={a._id} style={{...cs,borderLeft:"3px solid var(--accent)"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:15}}>{a.bounty?.company}</div>
                        <div style={{fontSize:13,color:"var(--muted)"}}>Client: <strong>{a.name}</strong> · {a.email}</div>
                        <div style={{fontFamily:"'Instrument Serif',serif",fontSize:22,color:"var(--accent)",marginTop:4}}>${a.bounty?.amount}</div>
                        {a.message&&<div style={{fontSize:13,color:"var(--muted)",fontStyle:"italic",marginTop:4}}>"{a.message}"</div>}
                      </div>
                      <button className="btn btn-accent btn-sm" onClick={()=>setEffectiveTab("getpaid")}>💸 Claim payment</button>
                    </div>
                  </div>
                ))}
              </div>
          )}

          {/* ── CREATOR: GET PAID ── */}
          {isCreator&&effectiveTab==="getpaid"&&(
            <div>
              <div style={{...cs,background:"linear-gradient(135deg,#f5f3ff,#ede9fe)",border:"1.5px solid #c4b5fd",marginBottom:24}}>
                <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>💸 Your Payment Details</div>
                <div style={{fontSize:13.5,color:"var(--muted)",marginBottom:14}}>Used for all payouts — fill once.</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><label className="label">Method</label>
                    <select className="select" value={payDetails.method} onChange={e=>setPayDetails(p=>({...p,method:e.target.value}))}>
                      <option value="">Select…</option>
                      {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div><label className="label">Handle / Address</label>
                    <input className="input" placeholder="@username or email" value={payDetails.handle} onChange={e=>setPayDetails(p=>({...p,handle:e.target.value}))}/>
                  </div>
                </div>
              </div>
              {activeOrders.length===0&&completedOrders.length===0
                ?<div className="empty"><div className="icon">💰</div><p>No orders to claim yet.</p></div>
                :<>
                  {activeOrders.length>0&&<>
                    <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"var(--muted)",marginBottom:10}}>Ready to claim</div>
                    {activeOrders.map(a=>(
                      <div key={a._id} style={cs}>
                        <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:15}}>{a.bounty?.company}</div>
                            <div style={{fontSize:13,color:"var(--muted)"}}>{a.name} · {a.email}</div>
                            <div style={{fontFamily:"'Instrument Serif',serif",fontSize:22,color:"var(--accent)",marginTop:4}}>${a.bounty?.amount}</div>
                          </div>
                          <button className="btn btn-green" onClick={()=>claimPay(a._id)} disabled={savingPay||!payDetails.method||!payDetails.handle}>
                            {savingPay?"…":"Claim →"}
                          </button>
                        </div>
                        {(!payDetails.method||!payDetails.handle)&&<div style={{fontSize:12,color:"var(--gold)",marginTop:8}}>⚠️ Fill payment details above first</div>}
                      </div>
                    ))}
                  </>}
                  {completedOrders.length>0&&<>
                    <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"var(--muted)",marginBottom:10,marginTop:20}}>Completed</div>
                    {completedOrders.map(a=>(
                      <div key={a._id} style={{...cs,opacity:.7}}>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <span style={{fontSize:20}}>{a.status==="paid"?"💰":"⏳"}</span>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:600}}>{a.bounty?.company}</div>
                            <div style={{fontSize:13,color:"var(--muted)"}}>{a.name}</div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontFamily:"'Instrument Serif',serif",fontSize:18,color:a.status==="paid"?"var(--green)":"var(--purple)"}}>${a.bounty?.amount}</div>
                            <span className={`sb ${a.status}`} style={{fontSize:11}}>{a.status==="paid"?"Paid":"Pending"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>}
                </>
              }
            </div>
          )}

          {/* ── CREATOR: MY SERVICES ── */}
          {isCreator&&effectiveTab==="services"&&(
            <div>
              <AddBountyInline token={currentUser.token} onAdded={load}/>
              {data.bounties?.length===0
                ?<div className="empty"><div className="icon">✨</div><p>No services yet.</p></div>
                :<div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {data.bounties?.map(b=>{
                    const isAuction=b.description?.includes("[auction]");
                    const brandsOnly=b.description?.includes("[brands-only]");
                    const isEditing=editingId===b._id;
                    return(
                      <div key={b._id} className="card" style={{overflow:"hidden"}}>
                        {!isEditing&&(
                          <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",flexWrap:"wrap"}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                                <span style={{fontWeight:700,fontSize:15}}>{b.company}</span>
                                {isAuction&&<span style={{background:"var(--accent-lt)",color:"var(--accent)",borderRadius:100,padding:"2px 9px",fontSize:11,fontWeight:700}}>🔨 Auction</span>}
                                {brandsOnly&&<span style={{background:"var(--purple-lt)",color:"var(--purple)",borderRadius:100,padding:"2px 9px",fontSize:11,fontWeight:700}}>🔒 Brands</span>}
                              </div>
                              {b.description&&<div style={{fontSize:12.5,color:"var(--muted)",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:380}}>{b.description.replace(" [auction]","").replace(" [brands-only]","")}</div>}
                            </div>
                            <div style={{fontFamily:"Instrument Serif",fontSize:22,color:"var(--accent)"}}>${b.amount}</div>
                            <div style={{display:"flex",gap:5,flexShrink:0}}>
                              <button className={`btn btn-sm ${isAuction?"btn-accent":"btn-ghost"}`} style={{fontSize:12}} onClick={()=>toggleAuction(b)} title="Toggle auction mode">🔨</button>
                              <button className="btn btn-secondary btn-sm" onClick={()=>startEdit(b)}>✏️</button>
                              <button className="btn btn-ghost btn-sm" style={{color:"var(--red)"}} onClick={()=>deleteBounty(b._id)} disabled={deletingId===b._id}>{deletingId===b._id?"…":"🗑"}</button>
                            </div>
                          </div>
                        )}
                        {isEditing&&(
                          <div style={{padding:"16px 18px",background:"var(--paper)",borderTop:"2px solid var(--accent)"}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                              <div className="field" style={{margin:0}}><label className="label">Service Name</label><input className="input" value={editForm.company||""} onChange={e=>setEditForm(f=>({...f,company:e.target.value}))}/></div>
                              <div className="field" style={{margin:0}}><label className="label">Price ($)</label><input className="input" type="number" value={editForm.amount||""} onChange={e=>setEditForm(f=>({...f,amount:e.target.value}))}/></div>
                            </div>
                            <div className="field" style={{marginBottom:14}}><label className="label">Description</label><textarea className="textarea" style={{minHeight:60}} value={editForm.description||""} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))}/></div>
                            <div style={{display:"flex",gap:8}}>
                              <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Cancel</button>
                              <button className="btn btn-accent" onClick={()=>saveEdit(b._id)} disabled={saving}>{saving?"Saving…":"Save"}</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              }
            </div>
          )}

          {/* ── CONTRACT: APPLICATIONS ── */}
          {!isCreator&&effectiveTab==="applications"&&(
            allAcc.length===0
              ?<div className="empty"><div className="icon">📭</div><p>No applications yet.</p></div>
              :<div className="tbl-wrap"><table className="tbl">
                <thead><tr><th>Applicant</th><th>Bounty</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{allAcc.map(a=>(
                  <tr key={a._id}>
                    <td><strong>{a.name}</strong><br/><span style={{fontSize:12,color:"var(--muted)"}}>{a.email}</span></td>
                    <td>{a.bounty?.company}<br/><strong style={{color:"var(--accent)"}}>${a.bounty?.amount}</strong></td>
                    <td style={{maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.message||"—"}</td>
                    <td><span className={`sb ${a.status}`}>{a.status.replace(/_/g," ")}</span></td>
                    <td>
                      {a.status==="pending"&&<div style={{display:"flex",gap:5}}>
                        <button className="btn btn-green btn-xs" onClick={()=>decide(a._id,"accepted")}>✓</button>
                        <button className="btn btn-red btn-xs" onClick={()=>decide(a._id,"rejected")}>✕</button>
                      </div>}
                      {a.status==="working"&&<span style={{fontSize:12,color:"var(--blue)"}}>In progress</span>}
                      {a.status==="payment_requested"&&<span style={{fontSize:12,color:"var(--purple)"}}>Payout pending</span>}
                      {a.status==="paid"&&<span style={{fontSize:12,color:"var(--green)",fontWeight:600}}>💰 Paid</span>}
                    </td>
                  </tr>
                ))}</tbody>
              </table></div>
          )}

          {/* ── CONTRACT: MY BOUNTIES ── */}
          {!isCreator&&effectiveTab==="bounties"&&(
            <div>
              <AddBountyInline token={currentUser.token} onAdded={load}/>
              {data.bounties?.length===0
                ?<div className="empty"><div className="icon">🎯</div><p>No bounties yet.</p></div>
                :<div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {data.bounties?.map(b=>{
                    const isEditing=editingId===b._id;
                    const isAuction=b.description?.includes("[auction]");
                    const cat=CAT[b.category];
                    return(
                      <div key={b._id} className="card" style={{overflow:"hidden"}}>
                        {!isEditing&&(
                          <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",flexWrap:"wrap"}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                                <span style={{fontWeight:700,fontSize:15}}>{b.company}</span>
                                <span className="badge badge-neutral" style={{fontSize:12}}>{cat?.icon} {cat?.label||b.category}</span>
                                {isAuction&&<span style={{background:"var(--accent-lt)",color:"var(--accent)",borderRadius:100,padding:"2px 9px",fontSize:11,fontWeight:700}}>🔨 Auction</span>}
                              </div>
                              {b.description&&<div style={{fontSize:13,color:"var(--muted)",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:400}}>{b.description.replace(" [auction]","")}</div>}
                            </div>
                            <div style={{fontFamily:"Instrument Serif",fontSize:22,color:"var(--accent)"}}>${b.amount}</div>
                            <div style={{display:"flex",gap:5,flexShrink:0}}>
                              <button className={`btn btn-sm ${isAuction?"btn-accent":"btn-ghost"}`} style={{fontSize:12}} onClick={()=>toggleAuction(b)} title="Toggle auction">🔨</button>
                              <button className="btn btn-secondary btn-sm" onClick={()=>startEdit(b)}>✏️ Edit</button>
                              <button className="btn btn-ghost btn-sm" style={{color:"var(--red)"}} onClick={()=>deleteBounty(b._id)} disabled={deletingId===b._id}>{deletingId===b._id?"…":"🗑"}</button>
                            </div>
                          </div>
                        )}
                        {isEditing&&(
                          <div style={{padding:"16px 18px",background:"var(--paper)",borderTop:"2px solid var(--accent)"}}>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                              <div className="field" style={{margin:0}}><label className="label">Company</label><input className="input" value={editForm.company||""} onChange={e=>setEditForm(f=>({...f,company:e.target.value}))}/></div>
                              <div className="field" style={{margin:0}}><label className="label">Category</label>
                                <select className="select" value={editForm.category||""} onChange={e=>setEditForm(f=>({...f,category:e.target.value}))}>
                                  {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                                </select>
                              </div>
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                              <div className="field" style={{margin:0}}><label className="label">Amount ($)</label><input className="input" type="number" value={editForm.amount||""} onChange={e=>setEditForm(f=>({...f,amount:e.target.value}))}/></div>
                              <div className="field" style={{margin:0}}><label className="label">Status</label>
                                <select className="select" value={editForm.status||"active"} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))}>
                                  <option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option>
                                </select>
                              </div>
                            </div>
                            <div className="field" style={{marginBottom:14}}><label className="label">Description</label><textarea className="textarea" style={{minHeight:60}} value={editForm.description||""} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))}/></div>
                            <div style={{display:"flex",gap:8}}>
                              <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Cancel</button>
                              <button className="btn btn-accent" onClick={()=>saveEdit(b._id)} disabled={saving}>{saving?"Saving…":"Save"}</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              }
            </div>
          )}

          {/* ── CONTRACT: SUGGESTED ── */}
          {!isCreator&&effectiveTab==="suggested"&&(
            data.suggested?.length===0
              ?<div className="empty"><div className="icon">💡</div><p>No suggestions yet.</p></div>
              :<div className="tbl-wrap"><table className="tbl">
                <thead><tr><th>Company</th><th>Type</th><th>Ask</th><th></th></tr></thead>
                <tbody>{data.suggested?.map(b=>(
                  <tr key={b._id}>
                    <td><strong>{b.company}</strong></td>
                    <td>{CAT[b.category]?.label||b.category}</td>
                    <td><strong style={{color:"var(--accent)"}}>${b.amount}</strong></td>
                    <td><div style={{display:"flex",gap:5}}>
                      <button className="btn btn-green btn-xs">✓</button>
                      <button className="btn btn-ghost btn-xs">✕</button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table></div>
          )}
        </>}
      </div>
    </div>
  );
}

function AdminPanel({currentUser,onNavigate,showToast}){
  const [tab,setTab]=useState("overview");
  const [data,setData]=useState({users:[],bounties:[],acceptances:[],totalAmount:0});
  const [loading,setLoading]=useState(true);
  const [smsMsg,setSmsMsg]=useState("");
  const [smsFilter,setSmsFilter]=useState("all");
  const [smsSending,setSmsSending]=useState(false);
  const [smsResult,setSmsResult]=useState(null);

  useEffect(()=>{load();},[]);
  const load=async()=>{
    setLoading(true);
    try{
      const r=await fetch(`${API}/admin/overview`,{headers:{Authorization:`Bearer ${currentUser.token}`}});
      const d=await r.json();
      if(d.success) setData(d);
      else showToast("Admin access denied","error");
    }catch{showToast("Network error","error");}
    setLoading(false);
  };

  const verifyPayment=async(accId,approve)=>{
    try{
      const r=await fetch(`${API}/admin/acceptance/${accId}/verify`,{method:"PATCH",headers:{"Content-Type":"application/json","Authorization":`Bearer ${currentUser.token}`},body:JSON.stringify({approve})});
      const d=await r.json();
      if(d.success){showToast(approve?"Payment approved! ✉️":"Sent back to helper","success");load();}
      else showToast(d.error||"Error","error");
    }catch{showToast("Network error","error");}
  };

  const sendBulkSMS=async()=>{
    if(!smsMsg.trim()){showToast("Enter a message","error");return;}
    setSmsSending(true);setSmsResult(null);
    try{
      const r=await fetch(`${API}/admin/bulk-sms`,{method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${currentUser.token}`},
        body:JSON.stringify({message:smsMsg,filter:smsFilter})});
      const d=await r.json();
      if(d.success){setSmsResult({sent:d.sent,total:d.total});showToast(`✅ Sent to ${d.sent} users!`,"success");}
      else showToast(d.error||"Error","error");
    }catch{showToast("Network error","error");}
    setSmsSending(false);
  };

  const pendingPayments=data.acceptances?.filter(a=>a.status==="payment_requested")||[];
  const allUsers=data.users||[];
  const usersWithPhone=allUsers.filter(u=>u.phone);
  const totalViews=allUsers.reduce((s,u)=>s+(u.pageViews||0),0);
  const CREATOR_CATS_B=["influencer","content","podcast_guest","beta_users","advisor","engineering","design_help","marketing","sales_lead","fundraising"];
  const creatorUsers=allUsers.filter(u=>u.categories?.some(c=>CREATOR_CATS_B.includes(c)));

  const tabs=[
    {id:"overview", label:"Overview",        icon:"📊"},
    {id:"users",    label:"Users",           icon:"👥", count:allUsers.length},
    {id:"payments", label:"Pending Payouts", icon:"💸", count:pendingPayments.length},
    {id:"sms",      label:"Bulk SMS",        icon:"📱", count:usersWithPhone.length},
  ];

  return(
    <div style={{background:"var(--paper)",minHeight:"100vh"}}>
      {/* Hero */}
      <div style={{background:"linear-gradient(135deg,#1a1045,#2d1b69)",padding:"32px 24px 28px"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,.4)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>🛡️ Admin Panel</div>
          <div style={{fontFamily:"'Instrument Serif',serif",fontSize:26,color:"#fff",marginBottom:16}}>TrueBounty Admin</div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            {[
              [allUsers.length,"Total Users"],
              [creatorUsers.length,"Creators"],
              [usersWithPhone.length,"With Phone"],
              [pendingPayments.length,"Pending Payouts"],
              [totalViews,"Total Views"],
            ].map(([n,l])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontFamily:"'Instrument Serif',serif",fontSize:28,color:"#fff",lineHeight:1}}>{n}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.35)",marginTop:3,textTransform:"uppercase",letterSpacing:".06em"}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginTop:16}}>
            <button className="btn btn-ghost btn-sm" style={{color:"rgba(255,255,255,.5)",borderColor:"rgba(255,255,255,.15)"}} onClick={()=>onNavigate("dashboard")}>← Dashboard</button>
            <button className="btn btn-ghost btn-sm" style={{color:"rgba(255,255,255,.5)",borderColor:"rgba(255,255,255,.15)"}} onClick={load}>↻ Refresh</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"24px 20px 60px"}}>
        <div style={{display:"flex",gap:2,flexWrap:"wrap",borderBottom:"2px solid var(--border)",marginBottom:24}}>
          {tabs.map(t=>(
            <button key={t.id} className={`d-tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>
              {t.icon} {t.label} {t.count!=null&&<span className="cnt">{t.count}</span>}
            </button>
          ))}
        </div>

        {loading?<div className="empty"><div className="icon">⏳</div><p>Loading…</p></div>:<>

          {/* ── OVERVIEW ── */}
          {tab==="overview"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div className="card" style={{padding:22}}>
                <div className="micro" style={{marginBottom:12}}>Pending Payment Claims</div>
                {pendingPayments.length===0&&<div style={{color:"var(--muted)",fontSize:13.5}}>No pending claims ✓</div>}
                {pendingPayments.map(a=>(
                  <div key={a._id} style={{padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:14}}>{a.name}</div>
                        <div style={{fontSize:12,color:"var(--muted)"}}>{a.bounty?.company} · <strong style={{color:"var(--accent)"}}>${a.bounty?.amount}</strong></div>
                        <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{a.paymentMethod} @ {a.paymentHandle}</div>
                        {a.completionNote&&<div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",marginTop:2}}>"{a.completionNote}"</div>}
                      </div>
                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                        <button className="btn btn-green btn-sm" onClick={()=>verifyPayment(a._id,true)}>✓ Approve</button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>verifyPayment(a._id,false)}>↩ Return</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card" style={{padding:22}}>
                <div className="micro" style={{marginBottom:12}}>Recent Signups</div>
                {allUsers.slice(0,8).map(u=>(
                  <div key={u._id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13}}>@{u.username}</div>
                      <div style={{fontSize:11.5,color:"var(--muted)"}}>{u.phone||u.email||"—"}</div>
                      <div style={{fontSize:11,marginTop:2}}>
                        <span style={{color:u.paymentMode==="self"?"#92400e":"#166534",fontWeight:600}}>
                          {u.paymentMode==="self"?"🤝 Self-pay":"🏦 TrueBounty"}
                        </span>
                        {u.paymentMode!=="self"&&u.paypalEmail&&<span style={{color:"var(--muted)",marginLeft:6}}>{u.paypalEmail}</span>}
                        {u.paymentMode!=="self"&&!u.paypalEmail&&<span style={{color:"var(--red)",marginLeft:6,fontSize:10}}>⚠ No PayPal</span>}
                      </div>
                    </div>
                    <div style={{fontSize:11.5,color:"var(--muted)",textAlign:"right"}}>
                      <div>{u.pageViews||0} views</div>
                      <div>{new Date(u.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {tab==="users"&&(
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Username</th><th>Phone</th><th>Type</th><th>Payment Mode</th><th>PayPal Email</th><th>Views</th><th>Joined</th></tr></thead>
                <tbody>
                  {allUsers.map(u=>{
                    const isCreator=u.categories?.some(c=>CREATOR_CATS_B.includes(c));
                    const isSelf=u.paymentMode==="self";
                    return(
                      <tr key={u._id}>
                        <td><strong>@{u.username}</strong></td>
                        <td style={{fontFamily:"monospace",fontSize:13}}>{u.phone||<span style={{color:"var(--muted)"}}>—</span>}</td>
                        <td>
                          <span style={{background:isCreator?"var(--accent-lt)":"var(--cream)",color:isCreator?"var(--accent)":"var(--muted)",borderRadius:100,padding:"2px 9px",fontSize:11,fontWeight:600}}>
                            {isCreator?"✨ Creator":"🎯 Bounty"}
                          </span>
                        </td>
                        <td>
                          <span style={{background:isSelf?"#fef3c7":"#f0fdf4",color:isSelf?"#92400e":"#166534",borderRadius:100,padding:"2px 9px",fontSize:11,fontWeight:600}}>
                            {isSelf?"🤝 Self":"🏦 TrueBounty"}
                          </span>
                        </td>
                        <td style={{fontSize:12,color:"var(--muted)",fontFamily:"monospace"}}>
                          {isSelf?"—":u.paypalEmail||<span style={{color:"var(--red)",fontSize:11}}>⚠ Not set</span>}
                        </td>
                        <td>{u.pageViews||0}</td>
                        <td style={{fontSize:12,color:"var(--muted)"}}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PENDING PAYOUTS ── */}
          {tab==="payments"&&(
            pendingPayments.length===0
              ?<div className="empty"><div className="icon">💸</div><p>No pending payouts.</p></div>
              :<div>{pendingPayments.map(a=>(
                <div key={a._id} className="card" style={{padding:"18px 20px",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:15}}>{a.name}</div>
                      <div style={{fontSize:13,color:"var(--muted)"}}>{a.email}</div>
                      <div style={{marginTop:8}}>
                        <span style={{fontWeight:700,fontSize:14}}>{a.bounty?.company}</span>
                        <span style={{marginLeft:8,fontFamily:"Instrument Serif",fontSize:20,color:"var(--accent)"}}>${a.bounty?.amount}</span>
                      </div>
                      <div style={{fontSize:12.5,color:"var(--muted)",marginTop:4}}>
                        Pay via <strong>{a.paymentMethod}</strong> to <strong>{a.paymentHandle}</strong>
                      </div>
                      {a.completionNote&&<div style={{fontSize:12.5,fontStyle:"italic",marginTop:4}}>"{a.completionNote}"</div>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0}}>
                      <button className="btn btn-green" onClick={()=>verifyPayment(a._id,true)}>✓ Approve & Pay</button>
                      <button className="btn btn-ghost btn-sm" onClick={()=>verifyPayment(a._id,false)}>↩ Return</button>
                    </div>
                  </div>
                </div>
              ))}</div>
          )}

          {/* ── BULK SMS ── */}
          {tab==="sms"&&(
            <div style={{maxWidth:620}}>
              <div className="card" style={{padding:"24px 22px",marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>📱 Bulk SMS</div>
                <div style={{fontSize:13.5,color:"var(--muted)",marginBottom:18}}>
                  Send a message to all users who signed up with a phone number.
                  Use <code style={{background:"var(--cream)",padding:"1px 5px",borderRadius:4}}>{"{"+"username{"+"}"}</code> to personalise.
                </div>

                {/* Filter */}
                <div style={{marginBottom:14}}>
                  <label className="label">Send to</label>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {[
                      {id:"all",     label:`All users (${usersWithPhone.length})`},
                      {id:"creators",label:`Creators only (${creatorUsers.filter(u=>u.phone).length})`},
                      {id:"bounty",  label:`Bounty users only (${allUsers.filter(u=>u.phone&&!u.categories?.some(c=>CREATOR_CATS_B.includes(c))).length})`},
                    ].map(f=>(
                      <button key={f.id} onClick={()=>setSmsFilter(f.id)}
                        style={{padding:"8px 16px",borderRadius:100,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif",border:`1.5px solid ${smsFilter===f.id?"var(--accent)":"var(--border)"}`,background:smsFilter===f.id?"var(--accent-lt)":"var(--card)",color:smsFilter===f.id?"var(--accent)":"var(--muted)"}}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div style={{marginBottom:16}}>
                  <label className="label">Message</label>
                  <textarea
                    className="textarea"
                    style={{minHeight:120,fontSize:14}}
                    placeholder={`Hey {username}! Check out your TrueBounty page — new features just dropped 🚀\n\ntruebounty.com`}
                    value={smsMsg}
                    onChange={e=>setSmsMsg(e.target.value)}
                  />
                  <div style={{fontSize:12,color:"var(--muted)",marginTop:4,display:"flex",justifyContent:"space-between"}}>
                    <span>{smsMsg.length} chars</span>
                    <span>{160-smsMsg.length>0?`${160-smsMsg.length} chars left (1 SMS)`:`${Math.ceil(smsMsg.length/153)} SMS segments`}</span>
                  </div>
                </div>

                {smsResult&&(
                  <div style={{background:"var(--green-lt)",border:"1px solid var(--green)",borderRadius:10,padding:"12px 16px",marginBottom:14,fontSize:13.5}}>
                    ✅ Sent to <strong>{smsResult.sent}</strong> of {smsResult.total} users with phone numbers.
                  </div>
                )}

                <button className="btn btn-accent" style={{width:"100%",padding:14,fontSize:15,fontWeight:700}}
                  onClick={sendBulkSMS} disabled={smsSending||!smsMsg.trim()}>
                  {smsSending?`Sending…`:`📱 Send to ${
                    smsFilter==="all"?usersWithPhone.length
                    :smsFilter==="creators"?creatorUsers.filter(u=>u.phone).length
                    :allUsers.filter(u=>u.phone&&!u.categories?.some(c=>CREATOR_CATS_B.includes(c))).length
                  } users`}
                </button>
              </div>

              {/* Phone number list */}
              <div className="card" style={{padding:"18px 20px"}}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>All phone numbers ({usersWithPhone.length})</div>
                {usersWithPhone.length===0
                  ?<div style={{color:"var(--muted)",fontSize:13.5}}>No users with phone numbers yet.</div>
                  :usersWithPhone.map(u=>(
                    <div key={u._id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid var(--border)"}}>
                      <div style={{fontWeight:600,fontSize:13}}>@{u.username}</div>
                      <div style={{fontFamily:"monospace",fontSize:13,color:"var(--muted)"}}>{u.phone}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </>}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING — 2 steps: pick categories + bounties, then create account
// ─────────────────────────────────────────────────────────────────────────────
function Onboarding({onComplete,showToast}){
  const [step,setStep]=useState(0);
  const [cats,setCats]=useState([]);
  const [otherItems,setOtherItems]=useState([]);
  const [defData,setDefData]=useState([]);   // pre-filled bounties
  const [chosen,setChosen]=useState([]);     // selected ids
  const [customB,setCustomB]=useState([]);   // user-added custom

  // Rebuild defaults whenever categories change; auto-select first per category
  useEffect(()=>{
    const defs=[];
    cats.forEach(catId=>(DEFAULTS[catId]||[]).forEach((b,i)=>
      defs.push({id:`${catId}_${i}`,category:catId,company:b.company,description:b.description,amount:b.amount})
    ));
    setDefData(defs);
    setChosen(prev=>{
      const kept=prev.filter(id=>defs.some(d=>d.id===id));
      const autoNew=cats
        .map(catId=>defs.find(d=>d.category===catId)?.id)
        .filter(id=>id&&!kept.includes(id));
      return [...kept,...autoNew];
    });
  },[cats]);

  const StepBar=()=>(
    <div className="ob-steps">
      {[{n:1,label:"Your needs"},{n:2,label:"Create account"}].map((s,i)=>{
        const st=i<step?"done":i===step?"active":"wait";
        return(
          <div key={s.n} style={{display:"flex",alignItems:"center"}}>
            {i>0&&<div className="ob-step-line"/>}
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div className={`ob-step-dot ${st}`}>{st==="done"?"✓":s.n}</div>
              <span className={`ob-step-lbl ${st==="active"?"active":""}`}>{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return(
    <div className="onboard-wrap">
      <div className="onboard-header">
        <div className="onboard-h">Build your TrueBounty page</div>
        <div className="onboard-p">2 steps · under 2 minutes · free forever</div>
        <StepBar/>
      </div>
      <div className="onboard-body">
        {step===0&&(
          <StepNeeds
            cats={cats} setCats={setCats}
            otherItems={otherItems} setOtherItems={setOtherItems}
            defData={defData} setDefData={setDefData}
            chosen={chosen} setChosen={setChosen}
            customB={customB} setCustomB={setCustomB}
            onNext={()=>setStep(1)}
          />
        )}
        {step===1&&(
          <StepAccount
            cats={cats} otherItems={otherItems}
            defData={defData} chosen={chosen} customB={customB}
            onBack={()=>setStep(0)} onComplete={onComplete}
          />
        )}
      </div>
    </div>
  );
}

// Step 1 — pick categories + see pre-filled bounties to check/edit
function StepNeeds({cats,setCats,otherItems,setOtherItems,defData,setDefData,chosen,setChosen,customB,setCustomB,onNext}){
  const [otherInp,setOtherInp]=useState("");
  const [showAddForm,setShowAddForm]=useState(false);
  const [newB,setNewB]=useState({company:"",category:"",amount:"",description:""});

  const toggleCat=id=>{
    setCats(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  };
  const toggleBounty=id=>setChosen(c=>c.includes(id)?c.filter(x=>x!==id):[...c,id]);
  const updateAmt=(id,val)=>setDefData(d=>d.map(b=>b.id===id?{...b,amount:Number(val)||0}:b));
  const addOther=()=>{const v=otherInp.trim();if(v&&!otherItems.includes(v)){setOtherItems(o=>[...o,v]);}setOtherInp("");};
  const addCustom=()=>{
    if(!newB.company||!newB.category||!newB.amount) return;
    setCustomB(b=>[...b,{...newB,id:`c_${Date.now()}`}]);
    setNewB({company:"",category:"",amount:"",description:""});
    setShowAddForm(false);
  };
  const total=chosen.length+customB.length;

  return(
    <div>
      <div className="step-title">I'm looking for… 🎯</div>
      <div className="step-sub">Select everything that applies — we'll pre-fill the details.</div>

      {/* Category chips — large, clear */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8,margin:"18px 0"}}>
        {CATEGORIES.map(c=>{
          const on=cats.includes(c.id);
          return(
            <div key={c.id} onClick={()=>toggleCat(c.id)}
              style={{
                border:`2px solid ${on?"var(--accent)":"var(--border)"}`,
                borderRadius:12,padding:"12px 14px",cursor:"pointer",
                background:on?"var(--accent-lt)":"var(--card)",
                transition:"all .13s",display:"flex",alignItems:"center",gap:9,
                color:on?"var(--accent)":"var(--ink)",
              }}>
              <span style={{fontSize:20}}>{c.icon}</span>
              <div>
                <div style={{fontWeight:600,fontSize:13.5,lineHeight:1.2}}>{c.label}</div>
              </div>
              {on&&<span style={{marginLeft:"auto",fontWeight:800,fontSize:14,color:"var(--accent)"}}>✓</span>}
            </div>
          );
        })}
      </div>

      {/* Live bounty preview */}
      {defData.length>0&&(
        <div className="ob-prev-box">
          <div className="ob-prev-hd">
            <span>Pre-filled for you — uncheck what you don't need</span>
            <span style={{fontWeight:400,color:"var(--muted)"}}>{chosen.length}/{defData.length} selected</span>
          </div>
          {defData.map(b=>{
            const on=chosen.includes(b.id);
            return(
              <div key={b.id} className="ob-b-row" onClick={()=>toggleBounty(b.id)}>
                <div className={`ob-b-chk ${on?"on":""}`}>{on?"✓":""}</div>
                <div className="ob-b-info">
                  <div className="ob-b-name">{b.company}</div>
                  <div className="ob-b-cat">{CAT[b.category]?.icon} {CAT[b.category]?.label} · {b.description}</div>
                </div>
                <div className="ob-b-amt" onClick={e=>e.stopPropagation()}>
                  <span className="ob-b-amt-sym">$</span>
                  <input className="ob-b-amt-inp" type="number" value={b.amount} onChange={e=>updateAmt(b.id,e.target.value)}/>
                </div>
              </div>
            );
          })}
          {customB.map(b=>(
            <div key={b.id} className="ob-b-row" style={{background:"var(--accent-lt)"}}>
              <div className="ob-b-chk on">✓</div>
              <div className="ob-b-info">
                <div className="ob-b-name">{b.company}</div>
                <div className="ob-b-cat">{CAT[b.category]?.icon} {CAT[b.category]?.label}{b.description?` · ${b.description}`:""}</div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{fontWeight:700,fontSize:14,color:"var(--accent)"}}>${b.amount}</div>
                <button className="icon-btn" style={{padding:"2px 7px",fontSize:12}} onClick={e=>{e.stopPropagation();setCustomB(c=>c.filter(x=>x.id!==b.id));}}>✕</button>
              </div>
            </div>
          ))}
          {!showAddForm?(
            <div style={{padding:"10px 16px"}}>
              <button className="btn btn-ghost btn-sm" style={{width:"100%"}} onClick={()=>setShowAddForm(true)}>+ Add a specific ask</button>
            </div>
          ):(
            <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)"}}>
              <div className="field-row3" style={{marginBottom:8}}>
                <div className="field" style={{margin:0}}><label className="label">Company / Target</label><input className="input" placeholder="e.g. Netflix" value={newB.company} onChange={e=>setNewB(f=>({...f,company:e.target.value}))}/></div>
                <div className="field" style={{margin:0}}><label className="label">Type</label>
                  <select className="select" value={newB.category} onChange={e=>setNewB(f=>({...f,category:e.target.value}))}>
                    <option value="">Category…</option>
                    {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div className="field" style={{margin:0}}><label className="label">$ Amount</label><input className="input" type="number" placeholder="100" value={newB.amount} onChange={e=>setNewB(f=>({...f,amount:e.target.value}))}/></div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowAddForm(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={addCustom} disabled={!newB.company||!newB.category||!newB.amount}>Add</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Something else input */}
      <div className="other-box">
        <div className="other-box-t">✨ Something else?</div>
        <div className="other-box-s">Type any custom need — it'll show as a tag on your profile.</div>
        <div style={{display:"flex",gap:8}}>
          <input className="input" style={{flex:1}} placeholder="e.g. Visa sponsorship, speaking gig…"
            value={otherInp} onChange={e=>setOtherInp(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&addOther()}/>
          <button className="btn btn-primary btn-sm" onClick={addOther}>Add</button>
        </div>
        {otherItems.length>0&&(
          <div className="other-tags">
            {otherItems.map(o=><span key={o} className="other-tag">{o}<button onClick={()=>setOtherItems(i=>i.filter(x=>x!==o))}>✕</button></span>)}
          </div>
        )}
      </div>

      {cats.length===0&&<div style={{textAlign:"center",padding:"8px 0 18px",color:"var(--muted)",fontSize:14}}>👆 Select what you're looking for to continue</div>}

      <button className="btn btn-accent btn-lg btn-full" onClick={onNext} disabled={cats.length===0&&otherItems.length===0}>
        {total>0?`Continue with ${total} request${total!==1?"s":""} →`:"Continue →"}
      </button>
    </div>
  );
}

// Step 2 — create account
function StepAccount({cats,otherItems,defData,chosen,customB,onBack,onComplete}){
  const [username,setUsername]=useState("");
  const [phone,setPhone]=useState("");
  const [code,setCode]=useState("");
  const [otpSent,setOtpSent]=useState(false);
  const [errs,setErrs]=useState({});
  const [loading,setLoading]=useState(false);
  const total=chosen.length+customB.length;

  const sendOTP=async()=>{
    const ae={};
    if(!username||username.length<2) ae.username="At least 2 characters";
    else if(!/^[a-z0-9_-]+$/.test(username)) ae.username="Lowercase, numbers, _ only";
    if(!phone||phone.replace(/\D/g,"").length<7) ae.phone="Enter a valid phone number";
    setErrs(ae);
    if(Object.keys(ae).length>0) return;
    setLoading(true);
    try{
      const r=await fetch(`${API}/auth/send-otp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone})});
      const d=await r.json();
      if(d.success) setOtpSent(true);
      else setErrs(e=>({...e,phone:d.error||"Failed to send code"}));
    }catch{setErrs(e=>({...e,phone:"Network error"}));}
    setLoading(false);
  };

  const signup=async()=>{
    if(code.length!==6){setErrs(e=>({...e,code:"Enter the 6-digit code"}));return;}
    setLoading(true);
    try{
      // Verify OTP first
      const rv=await fetch(`${API}/auth/verify-otp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone,code})});
      const dv=await rv.json();
      if(!dv.success){setErrs(e=>({...e,code:dv.error||"Incorrect code"}));setLoading(false);return;}

      // OTP verified — create account
      const bountiesToCreate=[...chosen.map(id=>defData.find(b=>b.id===id)).filter(Boolean),...customB];
      const r=await fetch(`${API}/auth/signup`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username,phone,email:"",fullName:username,
          categories:[...cats,...(otherItems.length?["other"]:[])],
          customFields:[],bountiesToCreate})});
      const d=await r.json();
      if(d.success){localStorage.setItem("bountyUser",JSON.stringify(d.user));onComplete(d.user);}
      else{
        const msg=d.error||"Signup failed";
        if(msg.toLowerCase().includes("username")) setErrs(e=>({...e,username:msg}));
        else if(msg.toLowerCase().includes("phone")) setErrs(e=>({...e,phone:msg}));
        else setErrs(e=>({...e,_g:msg}));
        setOtpSent(false); // let them retry
      }
    }catch{setErrs(e=>({...e,_g:"Network error. Please try again."}));}
    setLoading(false);
  };

  const Spinner=()=><span style={{width:14,height:14,border:"2px solid rgba(99,102,241,.3)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block"}}/>;

  return(
    <div>
      {total>0&&(
        <div style={{background:"var(--green-lt)",border:"1px solid #86efac",borderRadius:12,padding:"11px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:16}}>🎉</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13,color:"var(--green)"}}>Page ready to go live</div>
            <div style={{fontSize:12,color:"#16a34a"}}>{cats.length} categor{cats.length!==1?"ies":"y"} · {total} bount{total!==1?"ies":"y"}</div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{fontSize:12}} onClick={onBack}>← Edit</button>
        </div>
      )}
      <div className="signup-card">
        <div style={{fontFamily:"Instrument Serif",fontSize:22,marginBottom:4}}>Create your account</div>
        <div style={{fontSize:13.5,color:"var(--muted)",marginBottom:20}}>
          {otpSent?"Enter the code we sent to "+phone:"Your page goes live the moment you sign up."}
        </div>
        {errs._g&&<div className="alert alert-error" style={{marginBottom:14}}>⚠️ {errs._g}</div>}

        {!otpSent&&(
          <>
            <div className="field">
              <label className="label">Username</label>
              <input className={`input${errs.username?" input-err":""}`}
                placeholder="e.g. janesmith" value={username}
                onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g,""))}/>
              {!errs.username&&username&&<div style={{fontSize:11,color:"var(--accent)",marginTop:3}}>truebounty.com/referral/{username}</div>}
              {errs.username&&<div className="field-err">{errs.username}</div>}
            </div>
            <div className="field">
              <label className="label">Phone Number</label>
              <PhoneInput value={phone} onChange={v=>{setPhone(v);setErrs(e=>({...e,phone:""}));}} style={{width:"100%"}}/>
              {errs.phone&&<div className="field-err">{errs.phone}</div>}
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={sendOTP} disabled={loading}>
              {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spinner/>Sending…</span>:"Send Verification Code →"}
            </button>
          </>
        )}

        {otpSent&&(
          <>
            <div className="field">
              <label className="label">6-digit code</label>
              <input className={`input${errs.code?" input-err":""}`}
                placeholder="000000" value={code}
                onChange={e=>{setCode(e.target.value.replace(/\D/g,"").slice(0,6));setErrs(e=>({...e,code:""}));}}
                onKeyDown={e=>e.key==="Enter"&&code.length===6&&signup()}
                style={{fontSize:24,letterSpacing:8,textAlign:"center",fontWeight:700}}
                maxLength={6} inputMode="numeric" autoFocus/>
              {errs.code&&<div className="field-err">{errs.code}</div>}
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={signup} disabled={loading||code.length!==6}>
              {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spinner/>Creating your page…</span>:"🚀 Go Live →"}
            </button>
            <div style={{textAlign:"center",marginTop:10,fontSize:13,color:"var(--muted)"}}>
              <button style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:13}}
                onClick={()=>{setOtpSent(false);setCode("");}}>← Use different number</button>
              {" · "}
              <button style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:13}}
                onClick={sendOTP}>Resend code</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SignIn({onComplete,onSwitch}){
  const [phone,setPhone]=useState("");
  const [code,setCode]=useState("");
  const [step,setStep]=useState("phone"); // "phone" | "code"
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");

  const sendOTP=async()=>{
    if(!phone||phone.replace(/\D/g,"").length<7){setErr("Enter a valid phone number");return;}
    setErr(""); setLoading(true);
    try{
      const r=await fetch(`${API}/auth/send-otp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone})});
      const d=await r.json();
      if(d.success) setStep("code");
      else setErr(d.error||"Failed to send code");
    }catch{setErr("Network error — please try again");}
    setLoading(false);
  };

  const verifyOTP=async()=>{
    if(code.length!==6){setErr("Enter the 6-digit code");return;}
    setErr(""); setLoading(true);
    try{
      const r=await fetch(`${API}/auth/verify-otp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone,code})});
      const d=await r.json();
      if(d.success){
        if(d.exists){
          localStorage.setItem("bountyUser",JSON.stringify(d.user));
          onComplete(d.user);
        } else {
          // Phone verified but no account — send them to signup
          if(onSwitch) onSwitch({phone,verified:true});
        }
      } else setErr(d.error||"Incorrect code");
    }catch{setErr("Network error — please try again");}
    setLoading(false);
  };

  const Spinner=()=><span style={{width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block"}}/>;

  return(
    <div className="signin-wrap">
      <div className="signin-card">
        <div style={{fontFamily:"Instrument Serif",fontSize:26,fontWeight:400,marginBottom:4}}>
          {step==="phone"?"Welcome back":"Check your phone"}
        </div>
        <div style={{fontSize:13.5,color:"var(--muted)",marginBottom:22}}>
          {step==="phone"
            ?"Enter your phone number to sign in"
            :`We sent a 6-digit code to ${phone}`}
        </div>

        {err&&<div className="alert alert-error" style={{marginBottom:14}}>⚠️ {err}</div>}

        {step==="phone"&&(
          <>
            <div className="field">
              <label className="label">Phone Number</label>
              <PhoneInput value={phone} onChange={v=>{setPhone(v);setErr("");}} style={{width:"100%"}}/>
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={sendOTP} disabled={loading}>
              {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spinner/>Sending…</span>:"Send Code →"}
            </button>
          </>
        )}

        {step==="code"&&(
          <>
            <div className="field">
              <label className="label">6-digit code</label>
              <input className="input" placeholder="000000"
                value={code}
                onChange={e=>{setCode(e.target.value.replace(/\D/g,"").slice(0,6));setErr("");}}
                onKeyDown={e=>e.key==="Enter"&&code.length===6&&verifyOTP()}
                style={{fontSize:24,letterSpacing:8,textAlign:"center",fontWeight:700}}
                maxLength={6} inputMode="numeric" autoFocus/>
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={verifyOTP} disabled={loading||code.length!==6}>
              {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spinner/>Verifying…</span>:"Verify & Sign In →"}
            </button>
            <div style={{textAlign:"center",marginTop:12,fontSize:13,color:"var(--muted)"}}>
              <button style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:13}}
                onClick={()=>{setStep("phone");setCode("");setErr("");}}>
                ← Use a different number
              </button>
              {" · "}
              <button style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:13}}
                onClick={()=>{setCode("");setErr("");sendOTP();}}>
                Resend code
              </button>
            </div>
          </>
        )}

        <div style={{textAlign:"center",marginTop:16,fontSize:13,color:"var(--muted)"}}>
          Don't have an account?{" "}
          <button style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:600}}
            onClick={onSwitch}>Sign up →</button>
        </div>
      </div>
    </div>
  );
}

function CreatorOnboarding({onComplete, showToast}){
  const [username,setUsername]=useState("");

  // Per-category: { enabled: bool, brandsOnly: bool, services: {id: {on,price}} }
  const initCatState=()=>{
    const s={};
    CREATOR_CATS.forEach(cat=>{
      const svcs={};
      cat.services.forEach(sv=>{ svcs[sv.id]={on:false,price:""}; });
      s[cat.id]={enabled:false,brandsOnly:false,services:svcs};
    });
    return s;
  };
  const [cats,setCats]=useState(initCatState);
  const [phone,setPhone]=useState(""); // phone number
  const [code,setCode]=useState("");
  const [otpSent,setOtpSent]=useState(false);
  const [authErrs,setAuthErrs]=useState({});
  const [loading,setLoading]=useState(false);
  const [sharePopup,setSharePopup]=useState(null);

  const toggleCat=id=>setCats(p=>({...p,[id]:{...p[id],enabled:!p[id].enabled}}));
  const setBrandsOnly=(id,val)=>setCats(p=>({...p,[id]:{...p[id],brandsOnly:val}}));
  const toggleSvc=(catId,svcId)=>setCats(p=>({
    ...p,[catId]:{...p[catId],services:{...p[catId].services,
      [svcId]:{...p[catId].services[svcId],on:!p[catId].services[svcId].on}}}
  }));
  const setSvcPrice=(catId,svcId,val)=>setCats(p=>({
    ...p,[catId]:{...p[catId],services:{...p[catId].services,
      [svcId]:{...p[catId].services[svcId],price:val}}}
  }));

  const totalSelected=Object.values(cats).reduce((sum,cat)=>
    sum+Object.values(cat.services).filter(s=>s.on).length,0);


  const sendOTP=async()=>{
    const ae={};
    if(!username||username.length<2) ae.username='At least 2 characters';
    else if(!/^[a-z0-9_-]+$/.test(username)) ae.username='Lowercase letters, numbers, _ only';
    if(!phone||phone.replace(/\D/g,'').length<7) ae.phone='Enter a valid phone number';
    setAuthErrs(ae);
    if(Object.keys(ae).length>0) return;
    setLoading(true);
    try{
      const r=await fetch(`${API}/auth/send-otp`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
      const d=await r.json();
      if(d.success) setOtpSent(true);
      else setAuthErrs(e=>({...e,phone:d.error||'Failed to send code'}));
    }catch{setAuthErrs(e=>({...e,phone:'Network error'}));}
    setLoading(false);
  };

  const signup=async()=>{
    if(code.length!==6){setAuthErrs(e=>({...e,code:"Enter the 6-digit code"}));return;}
    setLoading(true);
    try{
      const vR=await fetch(`${API}/auth/verify-otp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone,code})});
      const vD=await vR.json();
      if(!vD.success){setAuthErrs(e=>({...e,code:vD.error||"Incorrect code"}));setLoading(false);return;}

      // Build bounties and categories from selected services
      const catMap={twitter:"influencer",newsletter:"content",youtube:"influencer",tiktok:"influencer",instagram:"influencer",podcast:"podcast_guest",community:"beta_users",speaking:"advisor",writing:"content",hired:"hiring_help",developer:"engineering",design:"design_help",marketing:"marketing",sales:"sales_lead",finance:"fundraising"};
      const bountiesToCreate=[];
      const enabledCats=[];
      CREATOR_CATS.forEach(cat=>{
        const cs=cats[cat.id];
        if(!cs?.enabled) return;
        enabledCats.push(catMap[cat.id]||"advisor");
        cat.services.forEach(sv=>{
          const s=cs.services[sv.id];
          if(!s?.on) return;
          bountiesToCreate.push({company:sv.label,category:catMap[cat.id]||"advisor",amount:Number(s.price)||0,description:sv.desc+(cs.brandsOnly?" [brands-only]":"")});
        });
      });

      const r=await fetch(`${API}/auth/signup`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username,phone,email:"",fullName:username,
          categories:enabledCats.length?enabledCats:["influencer"],
          customFields:[],bountiesToCreate})});
      const d=await r.json();
      if(d.success){
        localStorage.setItem("bountyUser",JSON.stringify(d.user));
        const pageUrl=`${window.location.origin}/referral/${d.user.username}`;
        setSharePopup(pageUrl);
        onComplete(d.user);
      } else {
        const msg=d.error||"Signup failed";
        if(d.field==="username"||msg.toLowerCase().includes("username")) setAuthErrs(e=>({...e,username:msg}));
        else if(d.field==="phone"||msg.toLowerCase().includes("phone")) setAuthErrs(e=>({...e,email:msg}));
        else setAuthErrs(e=>({...e,_g:msg}));
      }
    }catch{setAuthErrs(e=>({...e,_g:"Network error. Try again."}));}
    setLoading(false);
  };

  return(
    <div className="cr-wrap">
      <div className="cr-header">
        <div className="cr-h">Create your Creator Profile</div>
        <div className="cr-p">One page · all your services · let brands come to you · free forever</div>
      </div>
      <div className="cr-body">

        {/* ── Profile block ── */}
        <div className="card" style={{padding:"20px 22px",marginBottom:20}}>
          <div className="micro" style={{marginBottom:14}}>Your Profile</div>
          <div className="field" style={{marginBottom:0}}>
            <label className="label">Username / Handle</label>
            <input className={`input${authErrs.username?" input-err":""}`}
              placeholder="e.g. mrronak or anonymous42" value={username}
              onChange={e=>{setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g,""));setAuthErrs(er=>({...er,username:""}));}}/>
            {authErrs.username&&<div className="field-err">{authErrs.username}</div>}
            <div style={{fontSize:11.5,color:"var(--muted)",marginTop:4}}>
              💡 Can be a pseudonym — your phone is never shown publicly
            </div>
            {username&&!authErrs.username&&<div style={{fontSize:11,color:"var(--accent)",marginTop:3}}>{window.location.host}/referral/{username}</div>}
          </div>
        </div>

        {/* ── Category sections ── */}
        {CREATOR_CATS.map(cat=>{
          const cs=cats[cat.id];
          const selectedCount=Object.values(cs.services).filter(s=>s.on).length;
          return(
            <div key={cat.id} className={`cr-service`} style={{marginBottom:14,borderRadius:16,border:`2px solid ${cs.enabled?"var(--accent)":"var(--border)"}`}}>
              {/* Category header — click to expand */}
              <div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",padding:"18px 20px"}}
                onClick={()=>toggleCat(cat.id)}>
                <div style={{fontSize:24,lineHeight:1}}>{cat.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:16}}>{cat.label}</div>
                  <div style={{fontSize:12.5,color:"var(--muted)",marginTop:1}}>
                    {cs.enabled
                      ? selectedCount>0?`${selectedCount} service${selectedCount!==1?"s":""} selected`:"Click services below to add"
                      : "Click to add this to your profile"}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {cs.enabled&&selectedCount>0&&<span className="badge badge-accent">{selectedCount}</span>}
                  <div style={{
                    width:44,height:24,borderRadius:100,
                    background:cs.enabled?"var(--accent)":"var(--border)",
                    position:"relative",transition:"background .15s",flexShrink:0
                  }}>
                    <div style={{
                      width:20,height:20,borderRadius:"50%",background:"#fff",
                      position:"absolute",top:2,left:cs.enabled?22:2,
                      transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"
                    }}/>
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {cs.enabled&&(
                <div style={{borderTop:"1px solid var(--border)",padding:"16px 20px"}}>
                  {/* Brands-only toggle for whole category */}
                  <div className="cr-toggle-row" style={{marginBottom:16}}>
                    <div className={`cr-toggle ${cs.brandsOnly?"on":""}`}
                      onClick={()=>setBrandsOnly(cat.id,!cs.brandsOnly)}>
                      <div className="cr-toggle-dot"/>
                    </div>
                    <div className="cr-toggle-label">
                      <strong>🔒 Brands only</strong> — {cat.brandsOnlyLabel}
                    </div>
                  </div>

                  {/* Services grid */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                    {cat.services.map(sv=>{
                      const s=cs.services[sv.id]||{on:false,price:""};
                      return(
                        <div key={sv.id} style={{
                          border:`1.5px solid ${s.on?"var(--accent)":"var(--border)"}`,
                          borderRadius:10,background:s.on?"var(--accent-lt)":"var(--card)",
                          padding:"10px 12px",cursor:"pointer",transition:"all .13s"
                        }}>
                          <div style={{display:"flex",alignItems:"flex-start",gap:7}}
                            onClick={()=>toggleSvc(cat.id,sv.id)}>
                            <div style={{
                              width:18,height:18,borderRadius:5,flexShrink:0,marginTop:1,
                              border:`1.5px solid ${s.on?"var(--accent)":"var(--border)"}`,
                              background:s.on?"var(--accent)":"transparent",
                              display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:10,fontWeight:700,color:"#fff"
                            }}>{s.on?"✓":""}</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:13,fontWeight:600,lineHeight:1.3}}>{sv.label}</div>
                              <div style={{fontSize:11,color:"var(--muted)",marginTop:2,lineHeight:1.4}}>{sv.desc}</div>
                            </div>
                          </div>
                          {s.on&&(
                            <div style={{display:"flex",alignItems:"center",gap:4,marginTop:8}}
                              onClick={e=>e.stopPropagation()}>
                              <span style={{fontSize:13,color:"var(--muted)"}}>$</span>
                              <input
                                style={{flex:1,border:"1.5px solid var(--border)",borderRadius:7,padding:"5px 9px",fontSize:13,fontWeight:600,fontFamily:"'Inter',sans-serif",background:"#fff",minWidth:0}}
                                type="number" placeholder="Your price"
                                value={s.price}
                                onChange={e=>setSvcPrice(cat.id,sv.id,e.target.value)}/>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* ── Account creation ── */}
        <div className="signup-card" style={{marginTop:8}}>
          <div style={{fontFamily:"Instrument Serif",fontSize:22,marginBottom:4}}>
            {totalSelected>0?`Ready — ${totalSelected} service${totalSelected!==1?"s":""} on your page`:"Create your account"}
          </div>
          <div style={{fontSize:13.5,color:"var(--muted)",marginBottom:20}}>
            Your creator page goes live the moment you sign up.
          </div>
          {authErrs._g&&<div className="alert alert-error" style={{marginBottom:12}}>⚠️ {authErrs._g}</div>}
          <div className="field-row">
            <div className="field">
              <label className="label">Phone Number <span className="opt">(private — used for login)</span></label>
              <PhoneInput value={phone} onChange={v=>{setPhone(v);setAuthErrs(er=>({...er,phone:""}));}} style={{width:"100%"}}/>
              {authErrs.phone&&<div className="field-err">{authErrs.phone}</div>}
            </div>
          </div>
          {!otpSent&&(
            <button className="btn btn-accent btn-full btn-lg" onClick={sendOTP} disabled={loading} style={{marginTop:4}}>
              {loading?<span style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block"}}/> Sending…</span>:"Send Verification Code →"}
            </button>
          )}
          {otpSent&&(
            <div style={{marginTop:12}}>
              <div style={{fontSize:13.5,color:"var(--muted)",marginBottom:10,textAlign:"center"}}>Code sent to {phone}</div>
              <input placeholder="000000" value={code} onChange={e=>{setCode(e.target.value.replace(/\D/g,"").slice(0,6));setAuthErrs(er=>({...er,code:""}));}}
                onKeyDown={e=>e.key==="Enter"&&code.length===6&&signup()}
                style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:8,padding:"12px",fontSize:26,fontWeight:700,fontFamily:"'Inter',sans-serif",textAlign:"center",letterSpacing:8,outline:"none",marginBottom:10}}
                maxLength={6} inputMode="numeric" autoFocus/>
              {authErrs.code&&<div className="field-err">{authErrs.code}</div>}
              <button className="btn btn-accent btn-full btn-lg" onClick={signup} disabled={loading||code.length!==6}>
                {loading?<span style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:15,height:15,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block"}}/> Creating…</span>:"🚀 Go Live — Create My Creator Page"}
              </button>
              <div style={{textAlign:"center",marginTop:8,fontSize:12,color:"var(--muted)"}}>
                <button style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:12}} onClick={()=>{setOtpSent(false);setCode("");}}>← Different number</button>
                {" · "}
                <button style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:12}} onClick={sendOTP}>Resend</button>
              </div>
            </div>
          )}
          <div style={{marginTop:4}}>{""}</div>
          <div style={{textAlign:"center",marginTop:10,fontSize:12,color:"var(--muted)"}}>
            Free forever · No credit card · your phone stays private
          </div>
        </div>

      </div>

      {sharePopup&&<CreatorSharePopup url={sharePopup} username={username} onClose={()=>setSharePopup(null)}/>}
    </div>
  );
}

function CreatorSharePopup({url, username, onClose}){
  const [copied,setCopied]=useState(false);
  const copy=()=>{navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2500);};
  const enc=encodeURIComponent(url);
  const msg=encodeURIComponent("Just launched my creator page — see what I offer and let's work together:");

  const steps=[
    {icon:"📲",title:"Add to your bio",desc:"Put your TrueBounty link in your Twitter/X, Instagram, LinkedIn, and TikTok bio. This is your single link that shows everything you offer."},
    {icon:"📢",title:"Share a post",desc:"Tell your audience your page is live. Brands and clients who see it can book your services directly — no DM back-and-forth needed."},
    {icon:"💌",title:"Send it to brands",desc:"When a brand reaches out, send them your TrueBounty link instead of a rate card. They see your prices, verify their email, and pay you directly."},
  ];

  const shareNets=[
    {icon:"𝕏",  label:"Post on Twitter", href:`https://twitter.com/intent/tweet?text=${msg}%20${enc}`},
    {icon:"in", label:"Share on LinkedIn",href:`https://www.linkedin.com/sharing/share-offsite/?url=${enc}`},
    {icon:"💬", label:"Send on WhatsApp", href:`https://wa.me/?text=${msg}%20${enc}`},
  ];

  return(
    <div className="share-popup-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="share-popup" style={{maxWidth:520,textAlign:"left",padding:"36px 32px"}}>

        {/* Header */}
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:48,marginBottom:10}}>🚀</div>
          <div className="share-popup-title">You're live, @{username}!</div>
          <div style={{fontSize:14,color:"var(--muted)",lineHeight:1.65,marginTop:6}}>
            TrueBounty works by sharing your page link. The more places it appears, the more inbound bookings you get — no cold outreach needed.
          </div>
        </div>

        {/* URL box */}
        <div style={{background:"linear-gradient(135deg,#f5f3ff,#ede9fe)",border:"1.5px solid #c4b5fd",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1,fontFamily:"monospace",fontSize:13,color:"#4f46e5",fontWeight:600,wordBreak:"break-all"}}>{url}</div>
          <button onClick={copy}
            style={{flexShrink:0,background:copied?"#16a34a":"#6366f1",color:"#fff",border:"none",borderRadius:100,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .15s",whiteSpace:"nowrap"}}>
            {copied?"✓ Copied!":"Copy link"}
          </button>
        </div>

        {/* How it works steps */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:"var(--muted)",marginBottom:12}}>How to get your first booking</div>
          {steps.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:12,marginBottom:12,padding:"12px 14px",background:"var(--cream)",borderRadius:10}}>
              <div style={{fontSize:22,flexShrink:0,marginTop:1}}>{s.icon}</div>
              <div>
                <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{s.title}</div>
                <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.55}}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Share buttons */}
        <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:16}}>
          {shareNets.map(n=>(
            <a key={n.label} href={n.href} target="_blank" rel="noreferrer"
              style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",border:"1.5px solid rgba(99,102,241,.2)",borderRadius:12,cursor:"pointer",fontSize:14,fontWeight:600,textDecoration:"none",color:"var(--ink)",background:"rgba(99,102,241,.04)",transition:"all .12s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(99,102,241,.1)";e.currentTarget.style.borderColor="rgba(99,102,241,.4)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(99,102,241,.04)";e.currentTarget.style.borderColor="rgba(99,102,241,.2)";}}>
              <span style={{fontWeight:800,fontSize:18,width:22,textAlign:"center"}}>{n.icon}</span>
              {n.label}
              <span style={{marginLeft:"auto",fontSize:12,color:"var(--muted)"}}>→</span>
            </a>
          ))}
        </div>

        <button className="btn btn-accent btn-full" onClick={onClose} style={{padding:"13px"}}>
          View my creator page →
        </button>
      </div>
    </div>
  );
}

// SITE FOOTER — consistent across all pages
// ─────────────────────────────────────────────────────────────────────────────
// AccountForm is defined OUTSIDE SiteFooter so React never remounts it on re-render
// (defining a component inside another component causes remount on every keystroke = keyboard closes)
function SiteFooter({onNavigate}){
  const [showJoin,setShowJoin]=useState(false);
  const [joinStep,setJoinStep]=useState(0); // 0=pick mode, 1=pick cats, 2=pick services+prices, 3=account

  // Creator join state
  const initCreatorCats=()=>{
    const s={};
    CREATOR_CATS.forEach(cat=>{
      const svcs={};
      cat.services.forEach(sv=>{svcs[sv.id]={on:false,price:""};});
      s[cat.id]={enabled:false,brandsOnly:false,services:svcs};
    });
    return s;
  };
  const [crCats,setCrCats]=useState(initCreatorCats);

  // Contract join state
  const [contractMode,setContractMode]=useState(false);
  const [cats,setCats]=useState([]);
  const [defData,setDefData]=useState([]);
  const [chosen,setChosen]=useState([]);
  const [customB,setCustomB]=useState([]);
  const [showAddForm,setShowAddForm]=useState(false);
  const [newB,setNewB]=useState({company:"",category:"",amount:"",description:""});
  // Shared auth — OTP flow
  const [username,setUsername]=useState("");
  const [phone,setPhone]=useState("");
  const [code,setCode]=useState("");
  const [otpSent,setOtpSent]=useState(false);
  const [authErrs,setAuthErrs]=useState({});
  const [loading,setLoading]=useState(false);
  const signupRef=useRef(null);

  useEffect(()=>{
    const defs=[];
    cats.forEach(catId=>(DEFAULTS[catId]||[]).forEach((b,i)=>
      defs.push({id:`${catId}_${i}`,category:catId,company:b.company,description:b.description,amount:b.amount})
    ));
    setDefData(defs);
    setChosen(prev=>{
      const kept=prev.filter(id=>defs.some(d=>d.id===id));
      const autoNew=cats.map(c=>defs.find(d=>d.category===c)?.id).filter(id=>id&&!kept.includes(id));
      return [...kept,...autoNew];
    });
  },[cats]);

  const toggleCrCat=id=>setCrCats(p=>({...p,[id]:{...p[id],enabled:!p[id].enabled}}));
  const toggleCrSvc=(catId,svcId)=>setCrCats(p=>({...p,[catId]:{...p[catId],services:{...p[catId].services,[svcId]:{...p[catId].services[svcId],on:!p[catId].services[svcId].on}}}}));
  const setCrSvcPrice=(catId,svcId,val)=>setCrCats(p=>({...p,[catId]:{...p[catId],services:{...p[catId].services,[svcId]:{...p[catId].services[svcId],price:val}}}}));
  const setCrBrandsOnly=(catId,val)=>setCrCats(p=>({...p,[catId]:{...p[catId],brandsOnly:val}}));

  const toggleBounty=id=>setChosen(c=>c.includes(id)?c.filter(x=>x!==id):[...c,id]);
  const updateAmt=(id,val)=>setDefData(d=>d.map(b=>b.id===id?{...b,amount:Number(val)||0}:b));
  const addCustom=()=>{
    if(!newB.company||!newB.category||!newB.amount) return;
    setCustomB(b=>[...b,{...newB,id:`c_${Date.now()}`}]);
    setNewB({company:"",category:"",amount:"",description:""});
    setShowAddForm(false);
  };

  const crTotalSelected=Object.values(crCats).reduce((sum,cat)=>sum+Object.values(cat.services).filter(s=>s.on).length,0);
  const contractTotal=chosen.length+customB.length;

  const sendOTP=async(isCreator)=>{
    const ae={};
    if(!username||username.length<2) ae.username="At least 2 characters";
    else if(!/^[a-z0-9_-]+$/.test(username)) ae.username="Lowercase, numbers, _ only";
    if(!phone||phone.replace(/\D/g,"").length<7) ae.phone="Enter a valid phone number";
    if(Object.keys(ae).length>0){setAuthErrs({...ae,_g:"Please fill in all fields"});return;}
    setAuthErrs({});setLoading(true);
    try{
      const r=await fetch(`${API}/auth/send-otp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone})});
      const d=await r.json();
      if(d.success) setOtpSent(true);
      else setAuthErrs(e=>({...e,phone:d.error||"Failed to send code",_g:d.error}));
    }catch{setAuthErrs(e=>({...e,_g:"Network error — is the server running?"}));}
    setLoading(false);
  };

  const signup=async(isCreator)=>{
    if(code.length!==6){setAuthErrs(e=>({...e,code:"Enter the 6-digit code"}));return;}
    setLoading(true);
    try{
      // Verify OTP
      const rv=await fetch(`${API}/auth/verify-otp`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phone,code})});
      const dv=await rv.json();
      if(!dv.success){setAuthErrs(e=>({...e,code:dv.error||"Incorrect code"}));setLoading(false);return;}

      const catMap={twitter:"influencer",newsletter:"content",youtube:"influencer",tiktok:"influencer",instagram:"influencer",podcast:"podcast_guest",community:"beta_users",speaking:"advisor",writing:"content",hired:"hiring_help",developer:"engineering",design:"design_help",marketing:"marketing",sales:"sales_lead",finance:"fundraising"};
      let bountiesToCreate=[],categories=[];
      if(isCreator){
        CREATOR_CATS.forEach(cat=>{
          const cs=crCats[cat.id];
          if(!cs?.enabled) return;
          categories.push(catMap[cat.id]||"advisor");
          cat.services.forEach(sv=>{
            const s=cs.services[sv.id];
            if(!s?.on) return;
            bountiesToCreate.push({company:sv.label,category:catMap[cat.id]||"advisor",amount:Number(s.price)||0,description:sv.desc+(cs.brandsOnly?" [brands-only]":"")});
          });
        });
        if(!categories.length) categories=["influencer"];
      } else {
        bountiesToCreate=[...chosen.map(id=>defData.find(b=>b.id===id)).filter(Boolean),...customB];
        categories=cats.length?cats:["job_referral"];
      }
      const r=await fetch(`${API}/auth/signup`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username,phone,email:"",fullName:username,categories,customFields:[],bountiesToCreate})});
      const d=await r.json();
      if(d.success){localStorage.setItem("bountyUser",JSON.stringify(d.user));window.location.href=`/referral/${d.user.username}`;}
      else{
        const msg=d.error||"Signup failed";
        if(msg.toLowerCase().includes("username")) setAuthErrs(e=>({...e,username:msg,_g:msg}));
        else setAuthErrs(e=>({...e,_g:msg}));
        setOtpSent(false);
      }
    }catch(err){setAuthErrs(e=>({...e,_g:"Network error — is the server running?"}));}
    setLoading(false);
  };

  const openJoin=(isContract=false)=>{setShowJoin(true);setContractMode(isContract);setJoinStep(1);setTimeout(()=>signupRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),80);};

  return(
    <footer style={{background:"#07071a",borderTop:"1px solid rgba(255,255,255,.06)"}}>

      {/* ── MAIN FOOTER CONTENT ── */}
      <div style={{maxWidth:1060,margin:"0 auto",padding:"64px 28px 40px",display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:40}}>

        {/* Brand column */}
        <div>
          <div style={{fontFamily:"'Instrument Serif',serif",fontSize:22,color:"#fff",marginBottom:6}}>TrueBounty</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.3)",lineHeight:1.7,maxWidth:260,marginBottom:20}}>
            The creator monetisation and bounty platform. List your services, post bounties, get paid — zero platform fees.
          </div>
          {/* Social links */}
          <div style={{display:"flex",gap:10}}>
            {[
              {icon:"𝕏",href:"https://twitter.com"},
              {icon:"in",href:"https://linkedin.com"},
            ].map(s=>(
              <a key={s.icon} href={s.href} target="_blank" rel="noreferrer"
                style={{width:32,height:32,borderRadius:"50%",border:"1px solid rgba(255,255,255,.12)",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,.4)",textDecoration:"none",fontSize:13,fontWeight:700,transition:"all .13s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(165,180,252,.4)";e.currentTarget.style.color="#a5b4fc";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,.12)";e.currentTarget.style.color="rgba(255,255,255,.4)";}}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Creators */}
        <div>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"rgba(255,255,255,.3)",marginBottom:16}}>Creators</div>
          {[
            {label:"Create profile",action:()=>openJoin(false)},
            {label:"Twitter / X",action:()=>openJoin(false)},
            {label:"Newsletter",action:()=>openJoin(false)},
            {label:"YouTube",action:()=>openJoin(false)},
            {label:"Consulting",action:()=>openJoin(false)},
            {label:"Design",action:()=>openJoin(false)},
            {label:"All 15 categories",action:()=>openJoin(false)},
          ].map(l=>(
            <div key={l.label} onClick={l.action}
              style={{fontSize:13.5,color:"rgba(255,255,255,.4)",marginBottom:10,cursor:"pointer",transition:"color .12s"}}
              onMouseEnter={e=>e.currentTarget.style.color="#a5b4fc"}
              onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.4)"}>
              {l.label}
            </div>
          ))}
        </div>

        {/* Bounties */}
        <div>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"rgba(255,255,255,.3)",marginBottom:16}}>Bounties</div>
          {[
            {label:"Post a bounty",action:()=>openJoin(true)},
            {label:"Referrals",action:()=>openJoin(true)},
            {label:"Investor intros",action:()=>openJoin(true)},
            {label:"Hiring help",action:()=>openJoin(true)},
            {label:"Sales leads",action:()=>openJoin(true)},
            {label:"Advisors",action:()=>openJoin(true)},
            {label:"All categories",action:()=>openJoin(true)},
          ].map(l=>(
            <div key={l.label} onClick={l.action}
              style={{fontSize:13.5,color:"rgba(255,255,255,.4)",marginBottom:10,cursor:"pointer",transition:"color .12s"}}
              onMouseEnter={e=>e.currentTarget.style.color="#a5b4fc"}
              onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.4)"}>
              {l.label}
            </div>
          ))}
        </div>

        {/* Company */}
        <div>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"rgba(255,255,255,.3)",marginBottom:16}}>Company</div>
          {[
            {label:"How it works",href:"#"},
            {label:"Pricing",href:"#"},
            {label:"Blog",href:"#"},
            {label:"Privacy Policy",href:"#"},
            {label:"Terms of Service",href:"#"},
            {label:"Contact us",href:"mailto:hello@truebounty.com"},
          ].map(l=>(
            <a key={l.label} href={l.href}
              style={{display:"block",fontSize:13.5,color:"rgba(255,255,255,.4)",marginBottom:10,textDecoration:"none",transition:"color .12s"}}
              onMouseEnter={e=>e.currentTarget.style.color="#a5b4fc"}
              onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.4)"}>
              {l.label}
            </a>
          ))}
        </div>
      </div>

      {/* Feature strip */}
      <div style={{borderTop:"1px solid rgba(255,255,255,.06)",borderBottom:"1px solid rgba(255,255,255,.06)",padding:"18px 28px"}}>
        <div style={{maxWidth:1060,margin:"0 auto",display:"flex",gap:0,flexWrap:"wrap",justifyContent:"space-between"}}>
          {[
            {icon:"✨",text:"15 creator categories"},
            {icon:"💰",text:"0% platform fee"},
            {icon:"⚡",text:"Live in 2 minutes"},
            {icon:"🔒",text:"Stripe secured payments"},
            {icon:"📧",text:"Instant email notifications"},
            {icon:"🔨",text:"Auction mode"},
          ].map(f=>(
            <div key={f.text} style={{display:"flex",alignItems:"center",gap:7,fontSize:13,color:"rgba(255,255,255,.3)",padding:"6px 12px"}}>
              <span>{f.icon}</span>{f.text}
            </div>
          ))}
        </div>
      </div>

      {/* ── JOIN CTA ── */}
      <div style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",padding:"40px 28px",textAlign:"center"}}>
        <div style={{maxWidth:700,margin:"0 auto"}}>
          <div style={{fontFamily:"'Instrument Serif',serif",fontSize:"clamp(22px,3.5vw,34px)",color:"#fff",marginBottom:8,lineHeight:1.15}}>
            Ready to get paid for what you know?
          </div>
          <div style={{fontSize:14,color:"rgba(255,255,255,.65)",marginBottom:24}}>
            Free forever · No credit card · Under 2 minutes
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>openJoin(false)}
              style={{background:"#fff",color:"#4f46e5",border:"none",borderRadius:100,padding:"13px 28px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"'Inter',sans-serif",boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>
              ✨ Create Creator Profile
            </button>
            <button onClick={()=>openJoin(true)}
              style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:100,padding:"13px 28px",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
              🎯 Post Bounties
            </button>
          </div>
        </div>
      </div>

      {/* ── EXPANDABLE JOIN PANEL — stepped ── */}
      {showJoin&&(
        <div ref={signupRef} style={{background:"#08061e",borderTop:"2px solid rgba(165,180,252,.15)"}}>
          <div style={{maxWidth:680,margin:"0 auto",padding:"40px 24px 52px"}}>

            {/* Step indicator */}
            {(()=>{
              const creatorSteps = contractMode
                ? ["Mode","What I need","My bounties","Account"]
                : ["Mode","My categories","My services","Account"];
              const totalSteps = creatorSteps.length;
              return(
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",marginBottom:36,gap:0}}>
                  {creatorSteps.map((label,idx)=>{
                    const stepNum=idx; // 0-indexed, joinStep is 0-based too but step 0=mode picker
                    const done=joinStep>stepNum;
                    const active=joinStep===stepNum;
                    return(
                      <div key={label} style={{display:"flex",alignItems:"center"}}>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                          <div style={{
                            width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",
                            justifyContent:"center",fontSize:11,fontWeight:700,transition:"all .2s",
                            background:done?"#6366f1":active?"#fff":"rgba(255,255,255,.08)",
                            color:done?"#fff":active?"#4f46e5":"rgba(255,255,255,.25)",
                            border:active?"2px solid #6366f1":"2px solid transparent",
                          }}>
                            {done?"✓":stepNum+1}
                          </div>
                          <div style={{fontSize:10.5,fontWeight:active?700:400,color:active?"rgba(255,255,255,.9)":"rgba(255,255,255,.25)",whiteSpace:"nowrap",letterSpacing:".02em"}}>
                            {label}
                          </div>
                        </div>
                        {idx<totalSteps-1&&(
                          <div style={{width:44,height:1,background:joinStep>stepNum?"#6366f1":"rgba(255,255,255,.1)",margin:"0 4px 18px",transition:"background .3s"}}/>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* ── STEP 0: MODE PICKER ── */}
            {joinStep===0&&(
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:"'Instrument Serif',serif",fontSize:30,color:"#fff",marginBottom:8}}>What brings you here?</div>
                <div style={{fontSize:14,color:"rgba(255,255,255,.4)",marginBottom:32}}>Choose your path to get started</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,maxWidth:480,margin:"0 auto"}}>
                  <button onClick={()=>{setContractMode(false);setJoinStep(1);}}
                    style={{background:"linear-gradient(135deg,rgba(99,102,241,.2),rgba(139,92,246,.2))",border:"1.5px solid rgba(165,180,252,.3)",borderRadius:16,padding:"28px 20px",cursor:"pointer",textAlign:"left",transition:"all .14s",color:"#fff"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(165,180,252,.6)"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(165,180,252,.3)"}>
                    <div style={{fontSize:32,marginBottom:10}}>✨</div>
                    <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>I'm a Creator</div>
                    <div style={{fontSize:13,color:"rgba(255,255,255,.45)",lineHeight:1.5}}>List my services and let brands book me</div>
                  </button>
                  <button onClick={()=>{setContractMode(true);setJoinStep(1);}}
                    style={{background:"rgba(255,255,255,.04)",border:"1.5px solid rgba(255,255,255,.12)",borderRadius:16,padding:"28px 20px",cursor:"pointer",textAlign:"left",transition:"all .14s",color:"#fff"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.3)"}
                    onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,.12)"}>
                    <div style={{fontSize:32,marginBottom:10}}>🎯</div>
                    <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>I need help</div>
                    <div style={{fontSize:13,color:"rgba(255,255,255,.45)",lineHeight:1.5}}>Post bounties and pay people who deliver</div>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 1: PICK CATEGORIES ── */}
            {joinStep===1&&!contractMode&&(
              <div>
                <div style={{textAlign:"center",marginBottom:24}}>
                  <div style={{fontFamily:"'Instrument Serif',serif",fontSize:26,color:"#fff",marginBottom:6}}>What do you offer? ✨</div>
                  <div style={{fontSize:14,color:"rgba(255,255,255,.4)"}}>Select every category that applies — you can add more later</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:8,marginBottom:28}}>
                  {CREATOR_CATS.map(cat=>{
                    const on=crCats[cat.id]?.enabled;
                    return(
                      <div key={cat.id} onClick={()=>toggleCrCat(cat.id)}
                        style={{border:`2px solid ${on?"#6366f1":"rgba(255,255,255,.1)"}`,borderRadius:12,padding:"14px 12px",cursor:"pointer",
                          background:on?"rgba(99,102,241,.15)":"rgba(255,255,255,.03)",transition:"all .13s",textAlign:"center"}}>
                        <div style={{fontSize:22,marginBottom:6}}>{cat.icon}</div>
                        <div style={{fontSize:12.5,fontWeight:600,color:on?"#a5b4fc":"rgba(255,255,255,.6)",lineHeight:1.3}}>{cat.label}</div>
                        {on&&<div style={{fontSize:10,color:"#6366f1",marginTop:4,fontWeight:700}}>✓ Selected</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <button onClick={()=>setJoinStep(0)} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>← Back</button>
                  <button onClick={()=>setJoinStep(2)}
                    disabled={!Object.values(crCats).some(c=>c.enabled)}
                    style={{background:Object.values(crCats).some(c=>c.enabled)?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,.08)",color:"#fff",border:"none",borderRadius:100,padding:"13px 28px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .15s"}}>
                    {Object.values(crCats).filter(c=>c.enabled).length>0
                      ?`Next — set up ${Object.values(crCats).filter(c=>c.enabled).length} categor${Object.values(crCats).filter(c=>c.enabled).length===1?"y":"ies"} →`
                      :"Select at least one category"}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: PICK SERVICES + PRICES (CREATOR) ── */}
            {joinStep===2&&!contractMode&&(()=>{
              const enabledCats=CREATOR_CATS.filter(c=>crCats[c.id]?.enabled);
              const totalSel=Object.values(crCats).reduce((s,c)=>s+Object.values(c.services).filter(sv=>sv.on).length,0);
              return(
                <div>
                  <div style={{textAlign:"center",marginBottom:20}}>
                    <div style={{fontFamily:"'Instrument Serif',serif",fontSize:26,color:"#fff",marginBottom:6}}>Pick your services & prices</div>
                    <div style={{fontSize:14,color:"rgba(255,255,255,.4)"}}>Tap a category to expand · check what you offer · type your rate</div>
                  </div>

                  {enabledCats.map(cat=>{
                    const cs=crCats[cat.id];
                    const selCount=Object.values(cs.services).filter(s=>s.on).length;
                    // Each cat manages its own open state via a data attribute trick — use crCats brandsOnly field reused
                    // Instead track expanded in a separate piece of state
                    const isExpanded=cs._expanded===true;
                    const toggleExpand=()=>setCrCats(p=>({...p,[cat.id]:{...p[cat.id],_expanded:!p[cat.id]._expanded}}));
                    return(
                      <div key={cat.id} style={{marginBottom:8,borderRadius:14,overflow:"hidden",border:`1.5px solid ${selCount>0?"rgba(165,180,252,.35)":"rgba(255,255,255,.08)"}`,transition:"border-color .15s"}}>
                        {/* Clickable header — always visible */}
                        <div onClick={toggleExpand}
                          style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",background:isExpanded?"rgba(255,255,255,.06)":"rgba(255,255,255,.03)",transition:"background .13s"}}>
                          <span style={{fontSize:20}}>{cat.icon}</span>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:14,color:"#fff"}}>{cat.label}</div>
                            {selCount>0
                              ?<div style={{fontSize:11.5,color:"#a5b4fc",marginTop:2,fontWeight:600}}>{selCount} service{selCount!==1?"s":""} selected ✓</div>
                              :<div style={{fontSize:11.5,color:"rgba(255,255,255,.3)",marginTop:2}}>Tap to pick services</div>
                            }
                          </div>
                          {selCount>0&&<span style={{background:"#6366f1",color:"#fff",borderRadius:100,padding:"3px 10px",fontSize:12,fontWeight:700,flexShrink:0}}>{selCount}</span>}
                          <span style={{fontSize:16,color:"rgba(255,255,255,.3)",transition:"transform .2s",transform:isExpanded?"rotate(180deg)":"none",flexShrink:0}}>›</span>
                        </div>

                        {/* Expanded: brands-only + services */}
                        {isExpanded&&(
                          <div style={{borderTop:"1px solid rgba(255,255,255,.06)",background:"rgba(0,0,0,.15)"}}>
                            {/* Brands-only — prominent */}
                            <div style={{margin:"12px 12px 8px",background:"linear-gradient(135deg,rgba(99,102,241,.2),rgba(139,92,246,.2))",border:"1.5px solid rgba(165,180,252,.3)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                              <div style={{width:36,height:20,borderRadius:100,background:cs.brandsOnly?"#6366f1":"rgba(255,255,255,.15)",position:"relative",cursor:"pointer",transition:"background .15s",flexShrink:0}}
                                onClick={e=>{e.stopPropagation();setCrBrandsOnly(cat.id,!cs.brandsOnly);}}>
                                <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:cs.brandsOnly?18:2,transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}}/>
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:13,fontWeight:700,color:cs.brandsOnly?"#a5b4fc":"rgba(255,255,255,.7)"}}>
                                  🔒 Verified brands only
                                </div>
                                <div style={{fontSize:11.5,color:"rgba(255,255,255,.4)",marginTop:2}}>
                                  {cs.brandsOnly?"Prices hidden — only verified businesses can see them and book":"Turn on to hide prices from the public"}
                                </div>
                              </div>
                              {cs.brandsOnly&&<span style={{background:"rgba(99,102,241,.3)",color:"#a5b4fc",borderRadius:100,padding:"3px 9px",fontSize:11,fontWeight:700,flexShrink:0}}>ON</span>}
                            </div>

                            {/* Services grid */}
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,padding:"4px 12px 12px"}}>
                              {cat.services.map(sv=>{
                                const s=cs.services[sv.id]||{on:false,price:""};
                                return(
                                  <div key={sv.id} style={{
                                    border:`1.5px solid ${s.on?"rgba(165,180,252,.4)":"rgba(255,255,255,.07)"}`,
                                    borderRadius:8,background:s.on?"rgba(99,102,241,.12)":"rgba(255,255,255,.02)",
                                    padding:"8px 10px",transition:"all .12s",
                                  }}>
                                    <div style={{display:"flex",alignItems:"flex-start",gap:6,cursor:"pointer"}} onClick={()=>toggleCrSvc(cat.id,sv.id)}>
                                      <div style={{width:14,height:14,borderRadius:3,flexShrink:0,marginTop:1,
                                        border:`1.5px solid ${s.on?"#a5b4fc":"rgba(255,255,255,.2)"}`,
                                        background:s.on?"#6366f1":"transparent",
                                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:"#fff"}}>
                                        {s.on?"✓":""}
                                      </div>
                                      <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,.8)",lineHeight:1.3}}>{sv.label}</div>
                                    </div>
                                    {s.on&&(
                                      <div style={{display:"flex",alignItems:"center",gap:3,marginTop:5}}>
                                        <span style={{fontSize:11,color:"rgba(255,255,255,.35)"}}>$</span>
                                        <input type="number" inputMode="numeric" placeholder="Price"
                                          value={s.price}
                                          onChange={e=>setCrSvcPrice(cat.id,sv.id,e.target.value)}
                                          style={{flex:1,background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:5,padding:"3px 7px",fontSize:12,fontWeight:700,fontFamily:"'Inter',sans-serif",color:"#fff",minWidth:0,outline:"none"}}/>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:16}}>
                    <button onClick={()=>setJoinStep(1)} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>← Back</button>
                    <button onClick={()=>setJoinStep(3)}
                      style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",border:"none",borderRadius:100,padding:"13px 28px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                      {totalSel>0?`Next — ${totalSel} service${totalSel!==1?"s":""} selected →`:"Next — create account →"}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── STEP 1: WHAT DO YOU NEED (CONTRACT) ── */}
            {joinStep===1&&contractMode&&(
              <div>
                <div style={{textAlign:"center",marginBottom:24}}>
                  <div style={{fontFamily:"'Instrument Serif',serif",fontSize:26,color:"#fff",marginBottom:6}}>I'm looking for… 🎯</div>
                  <div style={{fontSize:14,color:"rgba(255,255,255,.4)"}}>Pick every category you need help with</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:8,marginBottom:28}}>
                  {CATEGORIES.map(c=>{
                    const on=cats.includes(c.id);
                    return(
                      <div key={c.id} onClick={()=>setCats(s=>s.includes(c.id)?s.filter(x=>x!==c.id):[...s,c.id])}
                        style={{border:`2px solid ${on?"#6366f1":"rgba(255,255,255,.1)"}`,borderRadius:12,padding:"14px 12px",cursor:"pointer",
                          background:on?"rgba(99,102,241,.15)":"rgba(255,255,255,.03)",transition:"all .13s",textAlign:"center"}}>
                        <div style={{fontSize:22,marginBottom:6}}>{c.icon}</div>
                        <div style={{fontSize:12.5,fontWeight:600,color:on?"#a5b4fc":"rgba(255,255,255,.6)",lineHeight:1.3}}>{c.label}</div>
                        {on&&<div style={{fontSize:10,color:"#6366f1",marginTop:4,fontWeight:700}}>✓ Selected</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <button onClick={()=>setJoinStep(0)} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>← Back</button>
                  <button onClick={()=>setJoinStep(2)} disabled={cats.length===0}
                    style={{background:cats.length>0?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,.08)",color:"#fff",border:"none",borderRadius:100,padding:"13px 28px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                    {cats.length>0?`Next — ${cats.length} categor${cats.length===1?"y":"ies"} →`:"Select at least one"}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: BOUNTIES (CONTRACT) ── */}
            {joinStep===2&&contractMode&&(
              <div>
                <div style={{textAlign:"center",marginBottom:20}}>
                  <div style={{fontFamily:"'Instrument Serif',serif",fontSize:26,color:"#fff",marginBottom:6}}>Your pre-filled bounties</div>
                  <div style={{fontSize:14,color:"rgba(255,255,255,.4)"}}>Uncheck any you don't want · adjust amounts · add custom ones</div>
                </div>
                <div style={{borderRadius:12,overflow:"hidden",border:"1px solid rgba(255,255,255,.08)",marginBottom:16}}>
                  {defData.map(b=>{
                    const on=chosen.includes(b.id);
                    return(
                      <div key={b.id} className={`ft-b-row ${on?"on":""}`} onClick={()=>toggleBounty(b.id)}>
                        <div className={`ft-b-chk ${on?"on":""}`}>{on?"✓":""}</div>
                        <div className="ft-b-info">
                          <div className="ft-b-name">{b.company}</div>
                          <div className="ft-b-cat">{CAT[b.category]?.icon} {CAT[b.category]?.label} · {b.description}</div>
                        </div>
                        <div className="ft-b-amt" onClick={e=>e.stopPropagation()}>
                          <span style={{color:"rgba(255,255,255,.4)",fontSize:11}}>$</span>
                          <input className="ft-amt-inp" type="number" inputMode="numeric" value={b.amount} onChange={e=>updateAmt(b.id,e.target.value)}/>
                        </div>
                      </div>
                    );
                  })}
                  {customB.map(b=>(
                    <div key={b.id} className="ft-b-row on">
                      <div className="ft-b-chk on">✓</div>
                      <div className="ft-b-info"><div className="ft-b-name">{b.company}</div><div className="ft-b-cat">{CAT[b.category]?.icon} {CAT[b.category]?.label}</div></div>
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{color:"#fff",fontWeight:700,fontSize:13}}>${b.amount}</span>
                        <button style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:4,color:"#fff",cursor:"pointer",fontSize:12,padding:"2px 7px"}} onClick={e=>{e.stopPropagation();setCustomB(c=>c.filter(x=>x.id!==b.id));}}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                {!showAddForm?(
                  <button className="ft-add-btn" onClick={()=>setShowAddForm(true)} style={{width:"100%",marginBottom:16}}>+ Add a custom bounty</button>
                ):(
                  <div style={{background:"rgba(255,255,255,.05)",borderRadius:10,padding:"14px",marginBottom:16,border:"1px solid rgba(255,255,255,.1)"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 90px",gap:8,marginBottom:8}}>
                      <div><div className="ft-label">Company</div><input className="ft-input" placeholder="Netflix" value={newB.company} onChange={e=>setNewB(f=>({...f,company:e.target.value}))}/></div>
                      <div><div className="ft-label">Type</div>
                        <select className="ft-select" value={newB.category} onChange={e=>setNewB(f=>({...f,category:e.target.value}))}>
                          <option value="">Category…</option>{CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                        </select>
                      </div>
                      <div><div className="ft-label">$</div><input className="ft-input" type="number" inputMode="numeric" placeholder="100" value={newB.amount} onChange={e=>setNewB(f=>({...f,amount:e.target.value}))}/></div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="ft-btn-ghost" onClick={()=>setShowAddForm(false)}>Cancel</button>
                      <button className="ft-btn-accent" onClick={addCustom} disabled={!newB.company||!newB.category||!newB.amount}>Add</button>
                    </div>
                  </div>
                )}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <button onClick={()=>setJoinStep(1)} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>← Back</button>
                  <button onClick={()=>setJoinStep(3)}
                    style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",border:"none",borderRadius:100,padding:"13px 28px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                    {(chosen.length+customB.length)>0?`Next — ${chosen.length+customB.length} bounti${chosen.length+customB.length===1?"":"es"} →`:"Next →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: ACCOUNT ── */}
            {joinStep===3&&(
              <div>
                <div style={{textAlign:"center",marginBottom:20}}>
                  <div style={{fontFamily:"'Instrument Serif',serif",fontSize:26,color:"#fff",marginBottom:6}}>
                    {otpSent?"Enter your code":(contractMode?"Create your account 🎯":"Create your account ✨")}
                  </div>
                  <div style={{fontSize:14,color:"rgba(255,255,255,.4)"}}>
                    {otpSent?`Code sent to ${phone}`:"Free forever · go live instantly"}
                  </div>
                </div>

                {Object.keys(authErrs).filter(k=>authErrs[k]).length>0&&(
                  <div style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,padding:"10px 14px",fontSize:13.5,color:"#fca5a5",marginBottom:14}}>
                    {authErrs.username&&<div>⚠ Username: {authErrs.username}</div>}
                    {authErrs.phone&&<div>⚠ Phone: {authErrs.phone}</div>}
                    {authErrs.code&&<div>⚠ Code: {authErrs.code}</div>}
                    {authErrs._g&&!authErrs.username&&!authErrs.phone&&!authErrs.code&&<div>⚠ {authErrs._g}</div>}
                  </div>
                )}

                {!otpSent&&(
                  <>
                    <div style={{marginBottom:12}}>
                      <div className="ft-label">Username</div>
                      <input className={`ft-input${authErrs.username?" ft-input-err":""}`}
                        placeholder="e.g. mrronak" value={username}
                        autoComplete="username" autoCorrect="off" autoCapitalize="none"
                        onChange={e=>{setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g,""));setAuthErrs(er=>({...er,username:""}));}}/>
                      {authErrs.username&&<div className="ft-field-err">⚠ {authErrs.username}</div>}
                    </div>
                    <div style={{marginBottom:20}}>
                      <div className="ft-label">Phone Number <span style={{fontWeight:400,opacity:.6}}>(private)</span></div>
                      <PhoneInput value={phone} onChange={v=>{setPhone(v);setAuthErrs(er=>({...er,phone:""}));}}
                        dark={true} style={{width:"100%"}}
                        inputStyle={{background:"rgba(255,255,255,.08)",border:"1.5px solid rgba(255,255,255,.2)",color:"#fff",borderRadius:"0 9px 9px 0"}}/>
                      {authErrs.phone&&<div className="ft-field-err">⚠ {authErrs.phone}</div>}
                    </div>
                    <button className="ft-cta-btn" onClick={()=>sendOTP(!contractMode)} disabled={loading}>
                      {loading
                        ?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                           <span style={{width:15,height:15,border:"2px solid rgba(99,102,241,.3)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block"}}/>
                           Sending code…
                         </span>
                        :"Send Verification Code →"}
                    </button>
                  </>
                )}

                {otpSent&&(
                  <>
                    <input placeholder="000000" value={code}
                      onChange={e=>{setCode(e.target.value.replace(/\D/g,"").slice(0,6));setAuthErrs(er=>({...er,code:""}));}}
                      onKeyDown={e=>e.key==="Enter"&&code.length===6&&signup(!contractMode)}
                      style={{width:"100%",background:"rgba(255,255,255,.08)",border:"1.5px solid rgba(255,255,255,.2)",borderRadius:8,padding:"14px",fontSize:28,fontWeight:700,fontFamily:"'Inter',sans-serif",color:"#fff",outline:"none",textAlign:"center",letterSpacing:10,marginBottom:12,boxSizing:"border-box"}}
                      maxLength={6} inputMode="numeric" autoFocus/>
                    <button className="ft-cta-btn" onClick={()=>signup(!contractMode)} disabled={loading||code.length!==6}>
                      {loading
                        ?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                           <span style={{width:15,height:15,border:"2px solid rgba(99,102,241,.3)",borderTopColor:"var(--accent)",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block"}}/>
                           Creating your page…
                         </span>
                        :contractMode
                          ?`🚀 Go Live — post ${(chosen.length+customB.length)||"my"} bounti${(chosen.length+customB.length)===1?"y":"es"}`
                          :`🚀 Go Live${crTotalSelected>0?` — ${crTotalSelected} service${crTotalSelected!==1?"s":""}`:""}`
                      }
                    </button>
                    <div style={{textAlign:"center",marginTop:10,fontSize:12,color:"rgba(255,255,255,.4)"}}>
                      <button style={{background:"none",border:"none",color:"rgba(255,255,255,.5)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:12}}
                        onClick={()=>{setOtpSent(false);setCode("");}}>← Different number</button>
                      {" · "}
                      <button style={{background:"none",border:"none",color:"rgba(255,255,255,.5)",cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:12}}
                        onClick={()=>sendOTP(!contractMode)}>Resend code</button>
                    </div>
                  </>
                )}

                <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginTop:10,textAlign:"center"}}>Free forever · No credit card · 0% fee</div>
                <div style={{display:"flex",justifyContent:"center",marginTop:14}}>
                  <button onClick={()=>{setJoinStep(2);setOtpSent(false);setCode("");}}
                    style={{background:"none",border:"none",color:"rgba(255,255,255,.25)",fontSize:12,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>← Back</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── BOTTOM BAR ── */}
      <div style={{borderTop:"1px solid rgba(255,255,255,.06)",padding:"18px 28px"}}>
        <div style={{maxWidth:1060,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div style={{fontSize:12,color:"rgba(255,255,255,.2)"}}>© {new Date().getFullYear()} TrueBounty, Inc. · All rights reserved.</div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            {["Privacy Policy","Terms of Service","Contact"].map(t=>(
              <button key={t} onClick={()=>{}} style={{fontSize:12,color:"rgba(255,255,255,.2)",background:"none",border:"none",cursor:"pointer",fontFamily:"'Inter',sans-serif",padding:0}}>{t}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function Landing({onNavigate}){
  const [activeTab,setActiveTab]=useState("twitter");

  const examples={
    twitter:[
      {service:"Sponsored Post",     price:500,  desc:"Single branded tweet to your followers"},
      {service:"Sponsored Thread",   price:800,  desc:"Multi-tweet story thread for your brand"},
      {service:"Monthly Retainer",   price:2500, desc:"4+ posts/month ongoing partnership"},
      {service:"Space Co-host",      price:1000, desc:"Live Twitter Space with your brand"},
      {service:"5-Post Bundle",      price:3200, desc:"Five coordinated branded posts"},
    ],
    newsletter:[
      {service:"Dedicated Send",     price:1500, desc:"Entire issue dedicated to your brand"},
      {service:"Top Placement Ad",   price:800,  desc:"First slot — maximum visibility"},
      {service:"3-Issue Bundle",     price:2000, desc:"Three consecutive issues"},
      {service:"Exclusive Sponsor",  price:3000, desc:"Sole sponsor, no competing ads"},
      {service:"Founder Interview",  price:1200, desc:"Your story in the newsletter"},
    ],
    youtube:[
      {service:"Brand Integration",  price:2000, desc:"Natural mention, 100k+ views"},
      {service:"Dedicated Video",    price:5000, desc:"Full video about your product"},
      {service:"Sponsored Segment",  price:1200, desc:"60-sec ad read, mid-video"},
      {service:"5-Video Bundle",     price:8000, desc:"Full campaign across five videos"},
      {service:"Shorts Promo",       price:600,  desc:"Short-form branded content"},
    ],
    consulting:[
      {service:"Fractional Hire",    price:3000, desc:"Part-time engagement, billed monthly"},
      {service:"1:1 Consulting",     price:300,  desc:"60-min strategy session"},
      {service:"Strategy Session",   price:500,  desc:"Business deep-dive advisory"},
      {service:"Project Work",       price:5000, desc:"End-to-end project delivery"},
      {service:"Advisory Role",      price:1000, desc:"Ongoing advisor on retainer"},
    ],
    design:[
      {service:"UX Audit",           price:800,  desc:"Deep review of your product UX"},
      {service:"Brand Identity",     price:2500, desc:"Full brand kit — logo, colours, type"},
      {service:"Landing Page",       price:1200, desc:"High-converting landing page design"},
      {service:"Design System",      price:4000, desc:"Complete component system"},
      {service:"Product Design",     price:3500, desc:"End-to-end UI/UX for your app"},
    ],
  };

  const tabs=[
    {id:"twitter",    icon:"𝕏",  label:"Twitter"},
    {id:"newsletter", icon:"📧", label:"Newsletter"},
    {id:"youtube",    icon:"▶️", label:"YouTube"},
    {id:"consulting", icon:"💼", label:"Consulting"},
    {id:"design",     icon:"🎨", label:"Design"},
  ];

  const ticker=["𝕏 Twitter","📧 Newsletter","▶️ YouTube","🎵 TikTok","📸 Instagram","🎙️ Podcast","👥 Community","🎤 Speaking","✍️ Writing","💼 Consulting","🔧 Developer","🎨 Design","📣 Marketing","📈 Sales","💰 Finance"];

  return(
    <>
      {/* ── HERO ── */}
      <div style={{background:"#07071a",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,.22) 0%,transparent 65%)",top:-200,right:-150,pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,.18) 0%,transparent 65%)",bottom:-100,left:-80,pointerEvents:"none"}}/>
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(236,72,153,.12) 0%,transparent 65%)",top:"30%",left:"45%",pointerEvents:"none"}}/>

        <div style={{maxWidth:900,margin:"0 auto",padding:"100px 24px 90px",textAlign:"center",position:"relative",zIndex:1}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(99,102,241,.15)",border:"1px solid rgba(165,180,252,.2)",borderRadius:100,padding:"6px 18px",fontSize:12,color:"#a5b4fc",fontWeight:700,marginBottom:28,letterSpacing:".06em"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#818cf8",display:"inline-block",animation:"pulse 2s infinite"}}/>
            THE CREATOR MONETISATION PLATFORM
          </div>

          <h1 style={{fontFamily:"'Instrument Serif',serif",fontSize:"clamp(42px,8vw,82px)",fontWeight:400,lineHeight:1.02,color:"#fff",marginBottom:22}}>
            Turn your audience<br/>
            <span style={{background:"linear-gradient(135deg,#818cf8 0%,#a78bfa 40%,#ec4899 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
              into income.
            </span>
          </h1>

          <p style={{fontSize:"clamp(15px,2.5vw,19px)",color:"rgba(255,255,255,.4)",maxWidth:500,margin:"0 auto 40px",fontWeight:300,lineHeight:1.75}}>
            List your services. Set your rates. Let brands and clients book you directly — across 15 categories and 300+ service types.
          </p>

          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:14}}>
            <button onClick={()=>onNavigate("creator")}
              style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",border:"none",borderRadius:100,padding:"16px 36px",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",boxShadow:"0 4px 28px rgba(99,102,241,.45)",transition:"all .15s",letterSpacing:"-.01em"}}>
              ✨ Create your Creator Page — free
            </button>
            <button onClick={()=>onNavigate("onboard")}
              style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.06)",color:"rgba(255,255,255,.6)",border:"1.5px solid rgba(255,255,255,.12)",borderRadius:100,padding:"16px 28px",fontSize:15,fontWeight:500,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .15s"}}>
              Post bounties instead →
            </button>
          </div>
          <div style={{color:"rgba(255,255,255,.2)",fontSize:13,cursor:"pointer"}} onClick={()=>onNavigate("signin")}>
            Already have an account? Sign in
          </div>

          {/* Stats */}
          <div style={{display:"flex",justifyContent:"center",gap:0,marginTop:60,flexWrap:"wrap",borderTop:"1px solid rgba(255,255,255,.06)",paddingTop:36}}>
            {[["15","Creator categories"],["300+","Services to list"],["0%","Platform fee"],["24h","Avg payout time"]].map(([n,l],i,arr)=>(
              <div key={l} style={{textAlign:"center",padding:"0 32px",borderRight:i<arr.length-1?"1px solid rgba(255,255,255,.08)":"none"}}>
                <div style={{fontFamily:"'Instrument Serif',serif",fontSize:36,color:"#fff",lineHeight:1}}>{n}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.28)",textTransform:"uppercase",letterSpacing:".09em",marginTop:6}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticker */}
        <div style={{borderTop:"1px solid rgba(255,255,255,.06)",padding:"13px 0",overflow:"hidden"}}>
          <div style={{display:"flex",animation:"ticker 25s linear infinite",width:"max-content"}}>
            {[...ticker,...ticker].map((t,i)=>(
              <div key={i} style={{padding:"0 24px",borderRight:"1px solid rgba(255,255,255,.06)",fontSize:13,color:"rgba(255,255,255,.3)",fontWeight:500,whiteSpace:"nowrap"}}>{t}</div>
            ))}
          </div>
          <style>{`
            @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
            @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
          `}</style>
        </div>
      </div>

      {/* ── WHAT YOU CAN SELL ── */}
      <div style={{background:"#0d0d20",padding:"88px 24px"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:44}}>
            <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"#818cf8",marginBottom:12}}>For Creators</div>
            <div style={{fontFamily:"'Instrument Serif',serif",fontSize:"clamp(28px,4vw,48px)",color:"#fff",marginBottom:10}}>Everything you can charge for</div>
            <div style={{fontSize:15,color:"rgba(255,255,255,.35)",maxWidth:420,margin:"0 auto"}}>Real service examples — set your own prices when you sign up.</div>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginBottom:28}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)}
                style={{display:"inline-flex",alignItems:"center",gap:6,padding:"9px 20px",borderRadius:100,border:`1.5px solid ${activeTab===t.id?"#818cf8":"rgba(255,255,255,.1)"}`,background:activeTab===t.id?"rgba(99,102,241,.2)":"transparent",color:activeTab===t.id?"#a5b4fc":"rgba(255,255,255,.45)",fontWeight:600,fontSize:13.5,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .13s"}}>
                <span style={{fontSize:16}}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {/* Service cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:10}}>
            {(examples[activeTab]||[]).map((s,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:"18px 16px",display:"flex",flexDirection:"column",gap:8,transition:"all .14s",cursor:"default"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(99,102,241,.12)";e.currentTarget.style.borderColor="rgba(129,140,248,.4)";e.currentTarget.style.transform="translateY(-3px)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.borderColor="rgba(255,255,255,.08)";e.currentTarget.style.transform="none";}}>
                <div style={{fontWeight:700,fontSize:14,color:"rgba(255,255,255,.9)"}}>{s.service}</div>
                <div style={{fontSize:12.5,color:"rgba(255,255,255,.35)",lineHeight:1.5,flex:1}}>{s.desc}</div>
                <div style={{fontFamily:"'Instrument Serif',serif",fontSize:24,color:"#a78bfa"}}>${s.price.toLocaleString()}</div>
              </div>
            ))}
            {/* CTA card */}
            <div style={{background:"linear-gradient(135deg,rgba(99,102,241,.3),rgba(139,92,246,.3))",border:"1.5px solid rgba(165,180,252,.3)",borderRadius:14,padding:"18px 16px",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",gap:10,cursor:"pointer",textAlign:"center",transition:"all .14s"}}
              onClick={()=>onNavigate("creator")}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="none"}>
              <div style={{fontSize:26}}>✨</div>
              <div style={{fontWeight:700,fontSize:14,color:"#fff"}}>Add your own</div>
              <div style={{fontSize:12,color:"rgba(165,180,252,.7)"}}>Set your price, go live</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{background:"#07071a",padding:"88px 24px",borderTop:"1px solid rgba(255,255,255,.05)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:52}}>
            <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"#818cf8",marginBottom:12}}>How it works</div>
            <div style={{fontFamily:"'Instrument Serif',serif",fontSize:"clamp(28px,4vw,46px)",color:"#fff",marginBottom:10}}>Live in under 2 minutes</div>
            <div style={{fontSize:15,color:"rgba(255,255,255,.3)"}}>No approval. No fees. No waiting.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:1,background:"rgba(255,255,255,.04)",borderRadius:20,overflow:"hidden"}}>
            {[
              {n:"01",icon:"🎨",t:"Pick your categories",d:"15 creator categories — Twitter, Newsletter, YouTube, Design, Consulting & more."},
              {n:"02",icon:"💰",t:"Set services & prices",d:"300+ pre-filled services. Check what you offer, type your rate."},
              {n:"03",icon:"🔗",t:"Share one link",d:"Your page goes live instantly. One URL to share everywhere."},
              {n:"04",icon:"💸",t:"Get booked & paid",d:"Clients book via Stripe. Payment confirmed within 24 hours."},
            ].map(s=>(
              <div key={s.n} style={{background:"rgba(255,255,255,.02)",padding:"28px 22px",borderRight:"1px solid rgba(255,255,255,.04)"}}>
                <div style={{fontSize:28,marginBottom:8}}>{s.icon}</div>
                <div style={{fontFamily:"'Instrument Serif',serif",fontSize:32,color:"rgba(99,102,241,.2)",lineHeight:1,marginBottom:6}}>{s.n}</div>
                <div style={{fontWeight:700,fontSize:14.5,color:"rgba(255,255,255,.9)",marginBottom:6}}>{s.t}</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.3)",lineHeight:1.65}}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TWO MODES ── */}
      <div style={{background:"#0d0d20",padding:"88px 24px",borderTop:"1px solid rgba(255,255,255,.05)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:44}}>
            <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",color:"#818cf8",marginBottom:12}}>Two modes</div>
            <div style={{fontFamily:"'Instrument Serif',serif",fontSize:"clamp(26px,4vw,44px)",color:"#fff"}}>Sell your services. Or get real help.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{background:"linear-gradient(135deg,#1e1b4b,#2d2b6b)",border:"1px solid rgba(165,180,252,.15)",borderRadius:20,padding:"32px 28px"}}>
              <div style={{background:"rgba(165,180,252,.12)",border:"1px solid rgba(165,180,252,.2)",borderRadius:100,padding:"4px 12px",fontSize:11,fontWeight:700,color:"#a5b4fc",letterSpacing:".06em",display:"inline-block",marginBottom:16}}>✨ CREATOR PROFILE</div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:22,color:"#fff",marginBottom:10}}>Monetise your expertise</div>
              <div style={{fontSize:13.5,color:"rgba(255,255,255,.45)",lineHeight:1.7,marginBottom:20}}>List what you offer. Set your price. Brands come to you — no cold pitching.</div>
              {["15 creator categories, 300+ services","Set brands-only pricing","Stripe payments direct to you","One link to share everywhere"].map(t=>(
                <div key={t} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"rgba(255,255,255,.6)",marginBottom:7}}>
                  <span style={{width:16,height:16,borderRadius:"50%",background:"rgba(129,140,248,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,flexShrink:0}}>✓</span>{t}
                </div>
              ))}
              <button onClick={()=>onNavigate("creator")}
                style={{marginTop:22,display:"inline-flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"#fff",border:"none",borderRadius:100,padding:"12px 24px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                Create Creator Profile →
              </button>
            </div>
            <div style={{background:"linear-gradient(135deg,#0f1623,#1a2336)",border:"1px solid rgba(99,102,241,.15)",borderRadius:20,padding:"32px 28px"}}>
              <div style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",borderRadius:100,padding:"4px 12px",fontSize:11,fontWeight:700,color:"#a5b4fc",letterSpacing:".06em",display:"inline-block",marginBottom:16}}>🎯 BOUNTY PAGE</div>
              <div style={{fontFamily:"'Instrument Serif',serif",fontSize:22,color:"#fff",marginBottom:10}}>Post bounties, get results</div>
              <div style={{fontSize:13.5,color:"rgba(255,255,255,.45)",lineHeight:1.7,marginBottom:20}}>Need a referral, intro, or advisor? Post a dollar bounty — pay only when delivered.</div>
              {["Referrals, investor intros, PR","Hiring help, sales leads","Co-founders, advisors, mentors","0% platform fee"].map(t=>(
                <div key={t} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"rgba(255,255,255,.6)",marginBottom:7}}>
                  <span style={{width:16,height:16,borderRadius:"50%",background:"rgba(99,102,241,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,flexShrink:0}}>✓</span>{t}
                </div>
              ))}
              <button onClick={()=>onNavigate("onboard")}
                style={{marginTop:22,display:"inline-flex",alignItems:"center",gap:6,background:"var(--accent)",color:"#fff",border:"none",borderRadius:100,padding:"12px 24px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                Post a Bounty →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FINAL CTA removed — same as footer */}
    </>
  );
}

// URL ROUTING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Category → short URL slug (for pretty URLs)
const CAT_SLUG = {
  job_referral:"referral", investor_intro:"investor", founder_intro:"founder",
  podcast_guest:"podcast", hiring_help:"hiring", sales_lead:"sales",
  pr_intro:"pr", influencer:"influencer", partnership:"partner",
  advisor:"advisor", mentor:"mentor", beta_users:"beta",
  design_help:"design", product_feedback:"feedback", distribution:"distribution",
  co_founder:"cofounder", customer_intro:"customer", freelancer:"freelancer",
  event_invite:"event", legal_advice:"legal", marketing:"marketing",
  engineering:"engineering", fundraising:"fundraising", content:"content",
  talent:"talent", research:"research", visa_sponsor:"visa",
  office_space:"office", accounting:"accounting", other:"page",
};

// Parse current URL path → {page, param}
function parsePath(pathname){
  const p=pathname.replace(/\/+$/,""); // strip trailing slash
  if(p===""||p==="/") return {page:"home",param:null};
  if(p==="/signin")   return {page:"signin",param:null};
  if(p==="/onboard")  return {page:"onboard",param:null};
  if(p==="/creator")  return {page:"creator",param:null};
  if(p==="/dashboard")return {page:"dashboard",param:null};
  if(p==="/admin")    return {page:"admin",param:null};
  if(p==="/adminstore") return {page:"admin",param:null};
  // Match /referral/:username/service/:serviceId
  const svcMatch=p.match(/^\/referral\/([a-z0-9_-]+)\/service\/([a-z0-9]+)$/i);
  if(svcMatch) return {page:"profile",param:svcMatch[1],serviceId:svcMatch[2]};
  // Match /:slug/:username  e.g. /referral/dddd
  const m=p.match(/^\/([a-z0-9_-]+)\/([a-z0-9_-]+)$/i);
  if(m) return {page:"profile",param:m[2]};
  // Match /bounties/:username (legacy)
  const legacy=p.match(/^\/bounties\/([a-z0-9_-]+)$/i);
  if(legacy) return {page:"profile",param:legacy[1]};
  return {page:"home",param:null};
}

// Build the pretty URL for a user's profile
function profileUrl(username, categories){
  const primary=categories?.[0];
  const slug=CAT_SLUG[primary]||"page";
  return `/${slug}/${username}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App(){
  const initRoute = parsePath(window.location.pathname);
  const [page,setPage]       = useState(initRoute.page);
  const [pageParam,setPageParam] = useState(initRoute.param);
  const [serviceId,setServiceId] = useState(initRoute.serviceId||null);
  const [currentUser,setCurrentUser] = useState(null);
  const [toast,setToast]     = useState(null);

  // Load saved user
  useEffect(()=>{
    try{const u=localStorage.getItem("bountyUser");if(u) setCurrentUser(JSON.parse(u));}catch{}
  },[]);

  // Listen for back/forward browser navigation
  useEffect(()=>{
    const onPop=()=>{
      const r=parsePath(window.location.pathname);
      setPage(r.page); setPageParam(r.param); setServiceId(r.serviceId||null);
    };
    window.addEventListener("popstate",onPop);
    return ()=>window.removeEventListener("popstate",onPop);
  },[]);

  const navigate=(p,param=null,replaceState=false)=>{
    setPage(p); setPageParam(param);
    let url="/";
    if(p==="home")      url="/";
    else if(p==="signin")    url="/signin";
    else if(p==="onboard")   url="/onboard";
    else if(p==="creator")   url="/creator";
    else if(p==="dashboard") url="/dashboard";
    else if(p==="admin")     url="/admin";
    else if(p==="profile"&&param){
      // Look up user's categories from currentUser or localStorage for pretty URL
      try{
        const u=JSON.parse(localStorage.getItem("bountyUser")||"{}");
        if(u.username===param) url=profileUrl(param,u.categories);
        else url=`/page/${param}`; // visitor viewing someone else — will refine after load
      }catch{ url=`/page/${param}`; }
    }
    if(replaceState) window.history.replaceState({p,param},""  ,url);
    else             window.history.pushState({p,param},"",url);
  };

  // After profile loads, update URL to use correct category slug
  const updateProfileUrl=(username,categories)=>{
    const url=profileUrl(username,categories);
    window.history.replaceState({p:"profile",param:username},"",url);
  };

  const showToast=(msg,type="success")=>setToast({msg,type});

  const handleAuth=user=>{
    setCurrentUser(user);
    localStorage.setItem("bountyUser",JSON.stringify(user));
    showToast(`Welcome, @${user.username}! 🎉`,"success");
    // Navigate to profile with pretty URL
    const url=profileUrl(user.username,user.categories);
    setPage("profile"); setPageParam(user.username);
    window.history.pushState({p:"profile",param:user.username},"",url);
  };

  return(
    <>
      <style>{css}</style>
      <nav className="nav">
        <div className="nav-logo" onClick={()=>navigate("home")}><div className="nav-dot"/>TrueBounty</div>
        <div className="nav-actions">
          {currentUser?(
            <>
              <button className="btn btn-ghost btn-sm" onClick={()=>navigate("profile",currentUser.username)}>My Page</button>
              {currentUser.isAdmin&&<button className="btn btn-purple btn-sm" onClick={()=>navigate("admin")}>🛡️ Admin</button>}
              <button className="btn btn-primary btn-sm" onClick={()=>navigate("dashboard")}>Dashboard</button>
            </>
          ):(
            <>
              <button className="btn btn-ghost btn-sm" onClick={()=>navigate("signin")}>Sign in</button>
              <button className="btn btn-accent btn-sm" onClick={()=>navigate("onboard")}>Get started</button>
            </>
          )}
        </div>
      </nav>

      {page==="home"      &&<Landing onNavigate={navigate}/>}
      {page==="onboard"   &&<Onboarding onComplete={handleAuth} showToast={showToast}/>}
      {page==="creator"   &&<CreatorOnboarding onComplete={handleAuth} showToast={showToast}/>}
      {page==="signin"    &&<SignIn onComplete={handleAuth} onSwitch={()=>navigate("onboard")}/>}
      {page==="profile"   &&<PublicPage username={pageParam} serviceId={serviceId} currentUser={currentUser} onNavigate={navigate} showToast={showToast} onProfileLoad={updateProfileUrl}/>}
      {page==="dashboard" &&currentUser&&<Dashboard currentUser={currentUser} onNavigate={navigate} showToast={showToast}/>}
      {page==="admin"     &&currentUser?.isAdmin&&<AdminPanel currentUser={currentUser} onNavigate={navigate} showToast={showToast}/>}
 
      <SiteFooter onNavigate={navigate}/>
      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
    </>
  );
}