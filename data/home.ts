// Copy and images for the front page. Edit freely; placeholder text is marked TODO.

export const brand = "BULLAIRS"

export const nav = [
  { label: "About Me", href: "#about" },
  { label: "Kicks", href: "/shoes" },
  { label: "Autographs", href: "#autographs" },
]

export const hero = {
  title: "DO I HAVE THIS?",
  tagline:
    "A personal collection of signed autographs, screen-inspired props and original 3D-printed pieces. Some are found, some are earned, and some are built from scratch, one layer at a time.",
  cta: { label: "See the kicks", href: "/shoes" },
  image: "/landing/maglanding.jpg",
}

export const about = {
  marquee: "Meet the collector",
  heading: "Collector, Designer & Sneakerhead",
  // TODO: write your bio
  body: "I design custom sneakers inspired by the movies, games and cartoons I grew up with, and I collect the signed pairs that started it all. Every shoe on the wall has a story, from the first sketch to the final lace.",
  image: "/shoes/hero/hero.png",
  smallImage: "/shoes/redfive/redfive.png",
}

export const collections: {
  title: string
  href?: string
  id?: string
  lead: string
  body: string
  image: string
}[] = [
  {
    title: "Custom Kicks",
    href: "/shoes",
    lead: "One-of-one designs built around a character, a scene or a world.",
    body: "Walk the shoe wall and open any lit pair to see it up close.",
    image: "/shoes/bulldokais/dbz12.png",
  },
  {
    title: "Signed Grails",
    id: "autographs",
    lead: "Pairs signed by the people who made them famous.",
    body: "The autograph collection is coming soon.",
    image: "/landing/portfolio.png",
  },
  {
    title: "Concept Drops",
    href: "/shoes",
    lead: "Experiments, mashups and pairs still on the drawing board.",
    body: "New designs land on the wall as they are finished.",
    image: "/shoes/camp_killer/1.png",
  },
]

export const quote = {
  heading: "The Story",
  // TODO: replace with your own words
  text: "Every pair on the wall started as a what-if. What if Goku had his own kicks? What if Link wore Dunks? Bullairs is where those ideas get made.",
  by: "Bullairs Footwear",
}

export const featured = {
  marquee: "Featured kicks",
  slugs: ["bulldokai", "redfive", "hero", "wind-walker", "camp_killer", "besties"],
}

export const drops = {
  marquee: "Latest collection",
  slugs: ["shadow_hunter", "labullbu_blue", "sewer-stompers"],
}

export const footer = {
  marquee: ["Custom kicks", "Signed grails", "One of one", "Bullairs footwear"],
  slugs: ["bulldokai", "redfive", "hero", "shoeboy-classic", "camp_killer", "labullbu_blue"],
}
