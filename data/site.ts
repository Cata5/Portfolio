/**
 * Site-wide configuration.
 *
 * Everything personal lives here or in the other files in `data/`.
 * No invented facts — every value below comes from the project brief.
 */

export const site = {
  name: "Manu Catalin-Gabriel",
  role: "Student @ ETTI CTI Bucharest",

  /**
   * PLACEHOLDER — replace with your real domain once deployed.
   * Used for canonical URLs, sitemap and Open Graph.
   */
  url: "https://catalin.dev",

  /**
   * Real address — the contact section's mailto link.
   */
  email: "cata.manu06@gmail.com",

  /**
   * Verified from the git remotes of the analyzed projects (github.com/Cata5).
   */
  github: "https://github.com/Cata5",

  /**
   * Socials from the old portfolio's footer.
   */
  linkedin: "https://www.linkedin.com/in/cata5",
  instagram: "https://www.instagram.com/cata0617",

  /**
   * PLACEHOLDER — link to the repository hosting this site's source.
   */
  source: "https://github.com/Cata5",

  tagline:
    "Computer & Information Technology student at ETTI Bucharest. I build web applications, experiment with machine learning, and craft software for whatever problem I find interesting.",

  description:
    "Manu Catalin-Gabriel — Computer & Information Technology (CTI) student at ETTI Bucharest seeking software engineering roles and internships.",

  /**
   * Shown in the hero's "currently building" workspace panel.
   */
  currently: {
    label: "Currently building",
    project: "Vortex",
    stack: "Kotlin · Jetpack Compose · ExoPlayer",
    status: "in progress",
  },
} as const;
