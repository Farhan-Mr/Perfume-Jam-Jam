document.addEventListener("DOMContentLoaded", () => {

  const navLinks = document.querySelectorAll('a[href^="#"]');

  navLinks.forEach(link => {

    link.addEventListener("click", function(e) {

      e.preventDefault();

      const target = document.querySelector(this.getAttribute("href"));

      if(target){

        target.scrollIntoView({
          behavior:"smooth"
        });

      }

    });

  });

});


document.addEventListener("DOMContentLoaded", function () {
  
  // 1. Automatically HTML sections par reveal class lagana (except Hero)
  const sectionsToAnimate = document.querySelectorAll(
    "#collection-section, #collection-cards, .product-section, .premium-hero-section, .newsletter-cta"
  );
  
  sectionsToAnimate.forEach((section) => {
    section.classList.add("reveal");
  });

  // 2. Scroll Reveal Logic (Intersection Observer for ultra-smooth performance)
  const revealOnScroll = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target); // Ek baar animate hone ke baad baar-baar nahi hoga
        }
      });
    },
    {
      threshold: 0.15, // Jab 15% section dikhega tab trigger hoga
    }
  );
  
  sectionsToAnimate.forEach((section) => {
    revealOnScroll.observe(section);
  });

  // 3. Category Filter Buttons active class toggle transition
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      filterButtons.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
    });
  });
});