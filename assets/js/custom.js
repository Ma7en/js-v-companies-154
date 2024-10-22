//home js
$(document).ready(function () {
	/************if ($("#do_more").length) {
		var waypoint = new Waypoint({
			element: document.getElementById('do_more'),
			handler: function () {
				$('.menu-bg').toggleClass('reverseMenu');
				$('.btn--search').toggleClass('search-toggle-bg');
				$('.stick-left-nav-ul > li').toggleClass('darkText');
				$('#logo').attr('fill', function (index, attr) {
					return attr === '#007cc3' ? '#fff' : '#007cc3';
				});
				$('.burger > .icon-bar1').toggleClass('icon-bar11');
				$('.burger > .icon-bar2').toggleClass('icon-bar21');
				$('.burger > .icon-bar3').toggleClass('icon-bar31');
			}
		});
	}****************/

	var pathName = window.location.pathname.toLowerCase();
	var pageUrl = 'others';
	if (pathName === '/australia' || pathName === '/australia.html' || pathName === '/cn.html') {
		pageUrl = 'home';
	}

	if ($("#core_capabilities").length !== 0 && pageUrl !== 'home') {
		var waypoint1 = new Waypoint({
			element: document.getElementById('core_capabilities'),
			handler: function () {
				$("header .container > .navbar-header,.container > .header-menu").toggleClass('hidden-xs hidden-sm hidden-md hidden-lg');
				$("header .container").toggleClass('mt45');
			}
		});
	}

	/* do more expand/collapse effect */
	$(document).on('click', '.expandHead', function () {
		var expandID = $(this).data('id');
		$(expandID).fadeIn();
		$(expandID).addClass('expandWrpr').removeClass('contractWrpr');
		$('.closeWrpr').addClass('closeWrprAnim');
	});
	$(document).on('click', '.closeWrpr', function () {
		$('.expandableDiv').removeClass('expandWrpr').addClass('contractWrpr');
		$('.expandableDiv').fadeOut();
		$('.closeWrpr').removeClass('closeWrprAnim');
	});

	/* index careers - employeespeak slider */
	var employeespeak_slider = $("#employeespeak_slider").find('.item').length;
	$("#employeespeak_slider").owlCarousel({
		dots: employeespeak_slider > 1 ? true : false,
		nav: employeespeak_slider > 1 ? true : false,
		touchDrag: employeespeak_slider > 1 ? true : false,
		mouseDrag: employeespeak_slider > 1 ? true : false,
		loop: employeespeak_slider > 1 ? true : false,
		autoplay: false,
		autoplayTimeout: 3000,
		autoplayHoverPause: true,
		responsive: {
			0: {
				items: 1
			},
			600: {
				items: 1
			},
			768: {
				items: 1
			},
			1000: {
				items: 1
			}
		}
	});


	/* left navigation hover effects */
	$(document).on('mouseenter', '.sticky-left-nav li', function () {
		if (!$(this).hasClass('mb50')) {
			$(this).addClass('nav-active');
		}
	});
	$(document).on('mouseleave', '.sticky-left-nav li', function () {
		if (!$(this).hasClass('mb50')) {
			$(this).removeClass('nav-active');
		}
	});

	$(window).scroll(function () {
		var windowPos = $(window).scrollTop();

		if (windowPos >= 100) {

			$('section.scroll-section').each(function (i) {
				if ($(this).position().top <= windowPos - 0) {
					$('.sticky-left-nav li.nav-active').removeClass('nav-active mb50');
					$('.sticky-left-nav li').eq(i).addClass('nav-active mb50');
				}
			});

		} else {
			$('.stick-left-nav-ul li.nav-active-menu').removeClass('nav-active-menu');
		}

		/* check footer offset for left sticky nav */
		checkFooterOffset();
	});

	function checkFooterOffset() {
		if ($('.sticky-left-nav').offset().top + $('.sticky-left-nav').height() >= $('footer').offset().top - 10) {
			$('.sticky-left-nav').addClass('bottom-menu').removeClass('top-menu');
		}

		if ($(document).scrollTop() + window.innerHeight < $('footer').offset().top) {
			$('.sticky-left-nav').addClass('top-menu').removeClass('bottom-menu');
		}
	}



	/* This part causes smooth scrolling on nav click */
	$("nav.sticky-left-nav a").click(function (evn) {
		evn.preventDefault();

		$(this).parent().addClass("nav-active");
		$('html, body').animate({
			scrollTop: $($(this).attr('href')).offset().top + 10
		}, 500);

	});

});
