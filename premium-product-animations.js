/* =========================================================
   PREMIUM PRODUCT ANIMATIONS — behaviour layer
   Purely additive: only adds/removes CSS classes and small
   decorative elements. Does not touch cart/wishlist/product
   logic in index.html, so it's safe to drop in alongside it.
   Load this AFTER index.html's own <script> blocks.
   ========================================================= */
(function(){
  "use strict";
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. Reveal-on-scroll for product cards ---- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
    entries.forEach(function(entry, i){
      if (entry.isIntersecting){
        var el = entry.target;
        var delay = (Number(el.dataset.revealIndex || 0) % 9) * 60;
        setTimeout(function(){ el.classList.add('inView'); }, delay);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;

  function wireCard(card, idx){
    if (card.dataset.premiumWired) return;
    card.dataset.premiumWired = '1';
    card.dataset.revealIndex = idx % 12;
    if (io && !reduced) io.observe(card);
    else card.classList.add('inView');

    /* image skeleton loading */
    var pic = card.querySelector('.pic');
    var img = card.querySelector('.pic img');
    if (pic && img){
      if (!img.complete || img.naturalWidth === 0){
        pic.classList.add('imgLoading');
        img.addEventListener('load', function(){ pic.classList.remove('imgLoading'); }, { once:true });
        img.addEventListener('error', function(){ pic.classList.remove('imgLoading'); }, { once:true });
      }
    }

    /* 3D tilt / parallax on hover, mouse-driven */
    if (pic && !reduced && window.matchMedia('(hover: hover)').matches){
      pic.addEventListener('mousemove', function(e){
        var r = pic.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        pic.style.setProperty('--rx', (px * 6).toFixed(2) + 'deg');
        pic.style.setProperty('--ry', (py * -6).toFixed(2) + 'deg');
      });
      pic.addEventListener('mouseleave', function(){
        pic.style.setProperty('--rx', '0deg');
        pic.style.setProperty('--ry', '0deg');
      });
    }

    /* wrap add-to-bag label text once, so CSS can append a checkmark state */
    var addBtn = card.querySelector('.add');
    if (addBtn && !addBtn.querySelector('.addLabel')){
      var label = document.createElement('span');
      label.className = 'addLabel';
      label.textContent = addBtn.textContent.trim();
      addBtn.textContent = '';
      addBtn.appendChild(label);
    }
  }

  function scanCards(){
    document.querySelectorAll('.grid .card, .curatedGrid .card').forEach(wireCard);
  }

  /* Watch for cards being (re)rendered by the store's own JS */
  var mo = new MutationObserver(function(){ scanCards(); });
  ['products','trendingGrid'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) mo.observe(el, { childList:true });
  });
  document.addEventListener('DOMContentLoaded', scanCards);
  scanCards();
  setTimeout(scanCards, 800); // catch late API-loaded renders

  /* ---- 2. Wishlist heart: pop + tiny particle burst ---- */
  document.addEventListener('click', function(e){
    var heart = e.target.closest('.heart');
    if (!heart) return;
    heart.classList.remove('heartPopStrong');
    void heart.offsetWidth;
    heart.classList.add('heartPopStrong');
    if (heart.classList.contains('liked') && !reduced){
      for (var i = 0; i < 6; i++){
        var dot = document.createElement('span');
        dot.className = 'heartDot';
        var angle = (Math.PI * 2 * i) / 6;
        var dist = 16 + Math.random() * 10;
        dot.style.setProperty('--dx', (Math.cos(angle) * dist) + 'px');
        dot.style.setProperty('--dy', (Math.sin(angle) * dist) + 'px');
        heart.appendChild(dot);
        (function(d){ setTimeout(function(){ d.remove(); }, 650); })(dot);
      }
    }
  });

  /* ---- 3. Add-to-bag: fill-wipe success state + header cart bump ---- */
  document.addEventListener('click', function(e){
    var btn = e.target.closest('[data-add-to-bag]');
    if (!btn || btn.disabled) return;
    btn.classList.remove('justAdded');
    void btn.offsetWidth;
    btn.classList.add('justAdded');
    setTimeout(function(){ btn.classList.remove('justAdded'); }, 1500);

    var bagIcon = document.querySelector('.bag');
    var count = document.querySelector('.bag .cartCount');
    if (bagIcon){
      bagIcon.classList.remove('cartBump');
      void bagIcon.offsetWidth;
      bagIcon.classList.add('cartBump');
      setTimeout(function(){ bagIcon.classList.remove('cartBump'); }, 500);
    }
    if (count){
      count.classList.remove('bump');
      void count.offsetWidth;
      count.classList.add('bump');
      setTimeout(function(){ count.classList.remove('bump'); }, 450);
    }
  });
})();
