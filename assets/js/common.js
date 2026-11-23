// aHR0cHM6Ly9naXRodWIuY29tL2x1b3N0MjYvYWNhZGVtaWMtaG9tZXBhZ2U=
$(function () {
    lazyLoadOptions = {
        scrollDirection: 'vertical',
        effect: 'fadeIn',
        effectTime: 300,
        placeholder: "",
        onError: function(element) {
            console.log('[lazyload] Error loading ' + element.data('src'));
        },
        afterLoad: function(element) {
            if (element.is('img')) {
                // remove background-image style
                element.css('background-image', 'none');
                element.css('min-height', '0');
            } else if (element.is('div')) {
                // set the style to background-size: cover; 
                element.css('background-size', 'cover');
                element.css('background-position', 'center');
            }
        }
    }

    $('img.lazy, div.lazy:not(.always-load)').Lazy({visibleOnly: true, ...lazyLoadOptions});
    $('div.lazy.always-load').Lazy({visibleOnly: false, ...lazyLoadOptions});

    $('[data-toggle="tooltip"]').tooltip()

    var $grid = $('.grid').masonry({
        "percentPosition": true,
        "itemSelector": ".grid-item",
        "columnWidth": ".grid-sizer"
    });
    // layout Masonry after each image loads
    $grid.imagesLoaded().progress(function () {
        $grid.masonry('layout');
    });

    $(".lazy").on("load", function () {
        $grid.masonry('layout');
    });

    // Sticky sidebar navigation (Teaching levels and Publication years)
    var $nav = $('#navbar-level, #navbar-year');
    if ($nav.length > 0) {
        var $links = $nav.find('.nav-link');
        var navbarOffset = 90;
        var sections = [];

        $links.each(function () {
            var href = $(this).attr('href');
            if (href && href.charAt(0) === '#') {
                var $target = $(href);
                if ($target.length) {
                    sections.push({
                        id: href,
                        $el: $target,
                        $link: $(this)
                    });
                }
            }
        });

        if (sections.length > 0) {
            function setActive(targetId) {
                $links.removeClass('active');
                for (var i = 0; i < sections.length; i++) {
                    if (sections[i].id === targetId) {
                        sections[i].$link.addClass('active');
                    }
                }
            }

            // Set initial active state based on URL hash or default to the first section
            var initialHash = window.location.hash;
            var matched = false;
            if (initialHash) {
                for (var i = 0; i < sections.length; i++) {
                    if (sections[i].id === initialHash) {
                        setActive(initialHash);
                        matched = true;
                        break;
                    }
                }
            }
            if (!matched) {
                setActive(sections[0].id);
            }

            var isManualScroll = false;
            var manualTimer = null;

            $links.on('click', function (e) {
                var href = $(this).attr('href');
                if (!href || href.charAt(0) !== '#') return;

                var sec = null;
                for (var i = 0; i < sections.length; i++) {
                    if (sections[i].id === href) {
                        sec = sections[i];
                        break;
                    }
                }
                if (!sec) return;

                e.preventDefault();
                setActive(href);

                isManualScroll = true;
                clearTimeout(manualTimer);

                var targetTop = sec.$el.offset().top - navbarOffset;
                if (targetTop < 0) targetTop = 0;

                window.scrollTo({
                    top: targetTop,
                    behavior: 'smooth'
                });

                if (window.history && window.history.pushState) {
                    window.history.pushState(null, null, href);
                } else {
                    window.location.hash = href;
                }

                manualTimer = setTimeout(function () {
                    isManualScroll = false;
                }, 800);
            });

            function updateOnScroll() {
                if (isManualScroll) return;

                var scrollPos = (window.pageYOffset || document.documentElement.scrollTop || 0) + navbarOffset + 20;
                var docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
                var winHeight = window.innerHeight;
                var canScroll = docHeight > winHeight + 80;
                var isBottom = ((window.pageYOffset || document.documentElement.scrollTop || 0) + winHeight >= docHeight - 30);

                if (canScroll && isBottom) {
                    setActive(sections[sections.length - 1].id);
                    return;
                }

                var current = sections[0].id;
                for (var i = 0; i < sections.length; i++) {
                    if (sections[i].$el.offset().top <= scrollPos) {
                        current = sections[i].id;
                    }
                }
                setActive(current);
            }

            $(window).on('scroll', updateOnScroll);
        }
    }
})
