/* =========================================================
   PREMIUM PRODUCT ANIMATIONS v2 — behaviour layer
   Purely additive: only adds/removes CSS classes and small
   decorative elements. Does not touch cart/wishlist/product
   logic in index.html, so it's safe to drop in alongside it.
   ========================================================= */
(function(){
  "use strict";
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

  /* ---- 1. Reveal-on-scroll for product cards ---- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
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

    var pic = card.querySelector('.pic');
    var img = card.querySelector('.pic img');
    if (pic && img){
      if (!img.complete || img.naturalWidth === 0){
        pic.classList.add('imgLoading');
        img.addEventListener('load', function(){ pic.classList.remove('imgLoading'); }, { once:true });
        img.addEventListener('error', function(){ pic.classList.remove('imgLoading'); }, { once:true });
      }
    }

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

  var mo = new MutationObserver(function(){ scanCards(); });
  ['products','trendingGrid'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) mo.observe(el, { childList:true });
  });
  document.addEventListener('DOMContentLoaded', scanCards);
  scanCards();
  setTimeout(scanCards, 800);

  /* ---- 2. Cursor spotlight across the product grid (desktop only) ---- */
  if (canHover && !reduced){
    document.querySelectorAll('.productsSection').forEach(function(section){
      section.classList.add('spotlightOn');
      section.addEventListener('mousemove', function(e){
        var r = section.getBoundingClientRect();
        section.style.setProperty('--spotX', (e.clientX - r.left) + 'px');
        section.style.setProperty('--spotY', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---- 3. Wishlist heart: pop + particle burst ---- */
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

  /* ---- 4. Digit-morph helper for the cart count badge ---- */
  function morphCount(countEl, fromValue, toValue){
    if (String(fromValue) === String(toValue)) return;
    countEl.innerHTML = '<span class="digitOld">' + fromValue + '</span><span class="digitNew">' + toValue + '</span>';
    countEl.classList.remove('morph'); void countEl.offsetWidth; countEl.classList.add('morph');
    setTimeout(function(){ countEl.textContent = String(toValue); countEl.classList.remove('morph'); }, 420);
  }

  /* ---- 5. FLY-TO-CART + Add-to-bag success state ---- */
  function flyToCart(sourceImg, cartEl, onLand){
    if (!sourceImg || !cartEl || reduced){ if (onLand) onLand(); return; }
    var sRect = sourceImg.getBoundingClientRect();
    var tRect = cartEl.getBoundingClientRect();
    var clone = sourceImg.cloneNode(true);
    clone.className = 'flyClone';
    clone.style.left = sRect.left + 'px';
    clone.style.top = sRect.top + 'px';
    clone.style.width = sRect.width + 'px';
    clone.style.height = sRect.height + 'px';
    document.body.appendChild(clone);

    var tx = (tRect.left + tRect.width / 2) - (sRect.left + sRect.width / 2);
    var ty = (tRect.top + tRect.height / 2) - (sRect.top + sRect.height / 2);
    clone.style.setProperty('--tx', tx + 'px');
    clone.style.setProperty('--ty', ty + 'px');

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ clone.classList.add('flying'); });
    });

    setTimeout(function(){
      clone.remove();
      var ring = document.createElement('span');
      ring.className = 'impactRing';
      cartEl.appendChild(ring);
      setTimeout(function(){ ring.remove(); }, 520);

      cartEl.classList.remove('cartBump'); void cartEl.offsetWidth; cartEl.classList.add('cartBump');
      setTimeout(function(){ cartEl.classList.remove('cartBump'); }, 520);

      if (onLand) onLand();
    }, 780);
  }

  /* Capture phase: snapshot the cart count BEFORE the store's own click
     handler (registered earlier, bubble phase) has a chance to update it. */
  document.addEventListener('click', function(e){
    var btn = e.target.closest('[data-add-to-bag]');
    if (!btn) return;
    var countEl = document.querySelector('.bag .cartCount');
    btn._ytPrevCount = countEl ? countEl.textContent.trim() : null;
  }, true);

  /* Bubble phase (registered after the store's own listener): by now the
     real cart/count has already been updated, so just animate the
     transition from the snapshotted old value to whatever it is now. */
  document.addEventListener('click', function(e){
    var btn = e.target.closest('[data-add-to-bag]');
    if (!btn || btn.disabled) return;

    btn.classList.remove('justAdded');
    void btn.offsetWidth;
    btn.classList.add('justAdded');
    setTimeout(function(){ btn.classList.remove('justAdded'); }, 1500);

    var card = btn.closest('.card');
    var sourceImg = card ? card.querySelector('.pic img') : null;
    var bagIcon = document.querySelector('.bag');
    var countEl = bagIcon ? bagIcon.querySelector('.cartCount') : null;
    var prev = btn._ytPrevCount;
    var current = countEl ? countEl.textContent.trim() : null;

    function land(){
      if (countEl && prev !== null && current !== null) morphCount(countEl, prev, current);
    }

    if (sourceImg && bagIcon){
      flyToCart(sourceImg, bagIcon, land);
    } else if (bagIcon){
      bagIcon.classList.remove('cartBump'); void bagIcon.offsetWidth; bagIcon.classList.add('cartBump');
      setTimeout(function(){ bagIcon.classList.remove('cartBump'); }, 500);
      land();
    }
  });
})();
