export interface FeatureExplanation {
  id: string;
  title: string;
  titleHinglish?: string;
  category: 'core' | 'ai' | 'social' | 'mindfulness' | 'privacy';
  english: {
    whatIsIt: string;
    howToUse: string;
    benefit: string;
  };
  hinglish: {
    whatIsIt: string;
    howToUse: string;
    benefit: string;
  };
}

export const FEATURE_EXPLANATIONS: Record<string, FeatureExplanation> = {
  // 1. AI Mindful Assistant & Companion
  aiAssistant: {
    id: 'aiAssistant',
    title: 'AI Mindful Assistant & Companion',
    titleHinglish: 'AI Journal Saathi & Empathy Guide',
    category: 'ai',
    english: {
      whatIsIt: 'An empathetic generative AI companion that listens to your thoughts, helps untangle complex emotions, and extracts structured mindful journal drafts.',
      howToUse: 'Type what happened today, choose a prompt spark, or ask for mindfulness advice, then click "Apply as Journal" or "Send to AI".',
      benefit: 'Overcomes writer\'s block, gives gentle psychological insights into your mood, and turns raw thoughts into beautifully written reflections.',
    },
    hinglish: {
      whatIsIt: 'Yeh ek smart AI dost hai jo aapki poore din ki baatein sunta hai, uljhe hue jazbaat ko samajhta hai aur ek sundar journal draft me badal deta hai.',
      howToUse: 'Apne din ki koi bhi baat likhein, AI se mindfulness advice maangein, aur "Apply as Journal" button dabayein.',
      benefit: 'Agar samajh na aaye kya likhna hai, toh AI aapko shuruwat karne aur mood analyse karne me madad karta hai.',
    },
  },

  // 2. Ambient Soundscape Synthesizer
  ambientSound: {
    id: 'ambientSound',
    title: 'Web Audio Ambient Synthesizer',
    titleHinglish: 'Ambient Soundscape & Real-time Zen Audio',
    category: 'mindfulness',
    english: {
      whatIsIt: 'A real-time acoustic Web Audio synthesizer that proceduralizes relaxing frequencies: Gentle Rain, Ocean Tides, Forest Breeze, Fireplace, and Cozy Cafe.',
      howToUse: 'Click the sound preset button, adjust the volume slider, and let the soothing audio play in the background while you journal.',
      benefit: 'Drowns out distracting external noise, lowers stress cortisol, and promotes a deep psychological flow state for writing.',
    },
    hinglish: {
      whatIsIt: 'Yeh real-time sound generator hai jo Barish (Rain), Samundar (Waves), Jungle ki hawa (Forest) aur Aag (Fireplace) ki sukoon bhari aawazein banata hai.',
      howToUse: 'Apni manpasand sound select karein, volume slider adjust karein aur diary likhte waqt background me enjoy karein.',
      benefit: 'Aas-paas ke shor ko khatam karta hai aur likhte waqt mann ko bilkul shaant aur focused banata hai.',
    },
  },

  // 3. Goals & Habits Constellation Tracker
  habitsAndGoals: {
    id: 'habitsAndGoals',
    title: 'Mindful Goals & Habit Constellation Tracker',
    titleHinglish: 'Goals & Habit Tracker (Aadat & Lakshya)',
    category: 'mindfulness',
    english: {
      whatIsIt: 'An integrated tracking system with dedicated habit streak calculations, completion cadence (daily/weekly/monthly), priority levels, and category tagging.',
      howToUse: 'Add a new habit or milestone goal, check off daily tasks to increase your streak count, and filter by status or priority.',
      benefit: 'Keeps you accountable to your long-term self-improvement journey and visualizes steady incremental growth.',
    },
    hinglish: {
      whatIsIt: 'Yeh aapki rozana ki aadatein (Habits) aur bade lakshya (Goals) ko track karta hai aur unka alag Habit Streak count banata hai.',
      howToUse: 'Naya goal ya habit add karein, har roz complete karne par checkmark dabayein aur apna streak badhayein.',
      benefit: 'Aapko regular banata hai aur self-improvement me consistent rehne me madad karta hai.',
    },
  },

  // 4. 3D Flipping Journal Book
  threeDJournal: {
    id: 'threeDJournal',
    title: '3D Interactive Flipping Journal Book',
    titleHinglish: '3D Flip Book (Asli Kitaab Ki Tarah Panna Palatna)',
    category: 'core',
    english: {
      whatIsIt: 'A Three.js WebGL-powered 3D book experience with dynamic page-turn curvature, realistic lighting, and dual-page reading layout.',
      howToUse: 'Click the previous/next navigation arrows, use keyboard arrow keys, or bookmark favorite memories in your personal volume.',
      benefit: 'Recreates the tactile intimacy and timeless satisfaction of reading a real physical hardcover journal.',
    },
    hinglish: {
      whatIsIt: 'Yeh ek realistic 3D kitaab hai jisme aap real book ki tarah panne (pages) palat kar apne puraane journals padh sakte hain.',
      howToUse: 'Next/Previous arrows par click karein ya keyboard arrow keys use karke panne aage-peeche karein.',
      benefit: 'Digital screen par bhi asli physical dairy padhne jaisa shandaar anubhav milta hai.',
    },
  },

  // 5. 3D Memory Orbit Visualizer
  memoryOrbit: {
    id: 'memoryOrbit',
    title: '3D Memory Orbit Sphere',
    titleHinglish: '3D Memory Orbit (Yaadon Ka Gola)',
    category: 'core',
    english: {
      whatIsIt: 'A 3D spatial celestial sphere where every photo keepsake and journal entry orbits as an interactive floating node.',
      howToUse: 'Click and drag with your mouse to rotate the orbit sphere, and click on any floating Polaroid node to inspect the memory and date.',
      benefit: 'Transforms your past memories into an interactive visual galaxy rather than a flat linear list.',
    },
    hinglish: {
      whatIsIt: 'Yeh ek 3D gola hai jisme aapki saari photos aur yaadein sitaron ki tarah ghoomti hui dikhai deti hain.',
      howToUse: 'Mouse se drag karke gole ko ghumayein aur kisi bhi photo par click karke uski details dekhein.',
      benefit: 'Purani yaadon ko ek naye aur visual 3D tarike se dekhne ka maza milta hai.',
    },
  },

  // 6. Multi-Device Cloud Vault & Sync
  cloudSync: {
    id: 'cloudSync',
    title: 'Multi-Device Cloud Vault & Sync',
    titleHinglish: 'Multi-Device Cloud Sync & Data Vault',
    category: 'privacy',
    english: {
      whatIsIt: 'Encrypted persistence layer that synchronizes your private reflections across all your phones, laptops, and browsers with JSON/Markdown export & import.',
      howToUse: 'Click the Cloud Vault button, copy your unique Passkey code to link other devices, or download a full JSON/Markdown backup.',
      benefit: 'Guarantees that your journals are permanently safe, portable, and accessible from anywhere without risking data loss.',
    },
    hinglish: {
      whatIsIt: 'Aapke saare journals ko cloud par surakshit rakhne aur doosre mobile ya computer me sync karne ki suvidha.',
      howToUse: 'Cloud Vault khol kar apna Secret Passkey copy karein aur doosre device me paste karein ya backup file download karein.',
      benefit: 'Phone ya browser change karne par bhi aapki koi bhi diary delete ya miss nahi hoti.',
    },
  },

  // 7. Public Journals (Community Sanctuary)
  publicFeed: {
    id: 'publicFeed',
    title: 'Public Journals (Community Sanctuary)',
    titleHinglish: 'Public Journals (Community Feed)',
    category: 'social',
    english: {
      whatIsIt: 'A peaceful community space where writers worldwide share inspirational reflections, positive insights, and life lessons.',
      howToUse: 'Read thoughts from others, tap the Heart to like, click Resonate to connect emotionally, or publish your own reflection.',
      benefit: 'Connect with mindful individuals worldwide, find solace in shared human experiences, and spread positivity.',
    },
    hinglish: {
      whatIsIt: 'Yeh ek shared community feed hai jahan log apne acche vichar, positive thoughts aur jeevan ki seekh share karte hain.',
      howToUse: 'Doosron ke journals padhein, pasand aane par Heart dabayein, ya "Share Reflection" se apna journal post karein.',
      benefit: 'Aapko positivity milti hai aur lagta hai ki aap apni journey me akele nahi hain.',
    },
  },

  // 8. My Journals (Private Linewise Archive)
  myJournals: {
    id: 'myJournals',
    title: 'My Journals (Private Linewise Archive)',
    titleHinglish: 'My Journals (Private Diary Archive & Calendar)',
    category: 'privacy',
    english: {
      whatIsIt: 'Your personal, end-to-end private journal repository organized in strict chronological sequence (Today, Yesterday, 2 Days Ago, 3 Days Ago) with archive calendar lookup.',
      howToUse: 'Scroll through your past reflections, click any date on the mini-calendar to look up history, or edit/delete entries.',
      benefit: '100% private to your account. Track your personal growth and emotional trends over time.',
    },
    hinglish: {
      whatIsIt: 'Yeh aapki private diary hai jo sequence me (Aaj, Kal, Parson) aapke saare puraane journals dikhati hai.',
      howToUse: 'Purani yaadein padhein, calendar me kisi bhi date par click karke us din ka journal dekhein ya edit karein.',
      benefit: 'Yeh poori tarah private aur secure hai sirf aapke account ke liye.',
    },
  },
};
