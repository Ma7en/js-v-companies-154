$(document).ready(function () {

	// $(window).scroll(function () {
	// 	var left_menu = $(".color-ctrl").offset().top;
	// 	var left_menu_height = $(".color-ctrl").height();

	// 	var cross_section = $("#opportunities").offset().top;
	// 	var cross_height_section = $("#opportunities").height();

	// 	if (left_menu + left_menu_height < cross_section) {
	// 		$(".scrollto-target-menu").removeClass("changecolor");
	// 	} else if (left_menu > cross_section + cross_height_section) {
	// 		$(".scrollto-target-menu").removeClass("changecolor");
	// 	} else {
	// 		$(".scrollto-target-menu").addClass("changecolor");
	// 	}
	// });

	//$(".hidden-list").css('display','block !important');

	/* ------------- SCROLL TO TARGET SECTION OOW Leftside menu ---------------*/
	$(".scrollto-target-menu").click(function (e) {
		e.preventDefault();
		$('.nav-active-menu').not($(this)).removeClass('nav-active-menu');
		$(this).addClass("nav-active-menu");
		$('html, body').animate({
			scrollTop: $($(this).attr('href')).offset().top + 150
		}, 700);
	});


	/* ------------- SCROLL to reach target section leftside menu ---------------*/
	$(window).scroll(function () {
		//Active menu
		if ($(window).scrollTop() >= 100) {
			$('.wrapper_sec section').each(function (i) {
				if ($(this).position().top <= $(window).scrollTop() + 100) {
					$('ul.stick-left-nav-ul li.nav-active-menu').removeClass('nav-active-menu');
					$('ul.stick-left-nav-ul li').eq(i + 1).addClass('nav-active-menu');
				}
			});

		} else {
			$('ul.stick-left-nav-ul li.nav-active-menu').removeClass('nav-active-menu');
		}


		//if (pageUrl == 'home') {

		if ($(window).scrollTop() >= 1) {
			$('.hero-list').addClass('hero-list1');
			$('.listmenu').css('z-index', '9999');
			$('.scrollbg-show').addClass('show-strip');
			$('#logo').attr('fill', '#007cc3');
			$('.menu-bg').addClass('reverseMenu');
			$('.burger > .icon-bar1').addClass('icon-bar11');
			$('.burger > .icon-bar2').addClass('icon-bar21');
			$('.burger > .icon-bar3').addClass('icon-bar31');
			$('.hidden-list').addClass('visible-list');
			$('.menu-bg, .burger').css('margin-top', '12px');
			$('.hamburger-menu > .search__color').find('.btn1').css('color', '#000');
			$('.search-icon').css('top', '20px');
			$('.search__color').find('.btn1').css('color', '#000');
			//$('.search__color').css('display', 'block');
		} else {
			$('.hero-list').removeClass('hero-list1');
			$('.listmenu').css('z-index', '2');
			$('.scrollbg-show').removeClass('show-strip');
			$('#logo').attr('fill', '#fff');
			$('.menu-bg').removeClass('reverseMenu');
			$('.burger > .icon-bar1').removeClass('icon-bar11');
			$('.burger > .icon-bar2').removeClass('icon-bar21');
			$('.burger > .icon-bar3').removeClass('icon-bar31');
			$('.hidden-list').removeClass('visible-list');
			$('.menu-bg, .burger').css('margin-top', '18px');
			$('.search-icon').css('top', '27px');
			$('.hamburger-menu > .search__color').find('.btn1').css('color', '#fff');
			$('.search__color').find('.btn1').css('color', '#fff');
			//$('.search__color').css('display', 'block');
		}

		//}


		/* check footer offset for left sticky nav */
		//checkFooterOffset();

	});



	if ($(window).scrollTop() >= 1) {
		$('.search__color').css('display', 'block');
	} else {
		$('.search__color').css('display', 'block');
	}



	/* check footer's offset value and change left-navigation's position */
	/*function checkFooterOffset() {
		if ($('.sticky-left-nav').offset().top + $('.sticky-left-nav').height() >= $('footer').offset().top - 10) {
			$('.sticky-left-nav').addClass('bottom-menu').removeClass('top-menu');
		}
		if ($(document).scrollTop() + window.innerHeight < $('footer').offset().top) {
			$('.sticky-left-nav').addClass('top-menu').removeClass('bottom-menu');
		}
	}*/



	// new code
	$(document).on("click", ".close-slide", function () {
		if ($(this).hasClass('open')) {
			$('.menu').fadeOut();
		} else {
			$('html, body').removeClass('hidden-scroll');
			closeMenu();
		}
	});

	//survey box
	$(".survey-open").hide();
	var surveyWidth = $(".fixed-box").width();
	$(".survey-close").click(function () {
		$(".fixed-box").animate({
			width: 30
		});
		$(".survey-close").hide();
		$(".survey-open").fadeIn();
	});
	$(".survey-open").click(function () {
		$(".fixed-box").animate({
			width: surveyWidth
		});
		$(".survey-open").hide();
		$(".survey-close").show();
	});

	//progress bar
	$(".progress-wrap").hide();
	$(".survey-submit").click(function () {
		//change background color after submit
		$(".fixed-box").addClass("change-bg")
		$(".survey-submit").hide();

		$(".progress-wrap").show();
		$(".fix-list").hide();
		$(".survey-progress .progress .progress-bar").css("width", function () {
			return $(this).attr("aria-valuenow") + "%";
		});
	});

	//scroll to top
	$(".scroll-target").on('click', function (e) {
		e.preventDefault();
		$('html, body').animate({
			scrollTop: $($(this).attr('href')).offset().top + 10
		}, 700);
	});



	// new code usa

	/* index careers - employeespeak slider */
	var employeespeak_slider = $("#employeespeak_slider").find('.item').length;
	$("#employeespeak_slider").owlCarousel({
		dots: employeespeak_slider > 1 ? true : false,
		nav: employeespeak_slider > 1 ? false : false,
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

	// Testimonial Video
	var three_item_show = $(".three_item").find('.item').length;
	//alert(testimonial_slider_video);		
	$(".three_item").owlCarousel({
		slideBy: 2,
		margin: 20,
		dots: three_item_show > 3 ? false : false,
		nav: three_item_show > 3 ? true : false,
		touchDrag: three_item_show > 3 ? true : false,
		mouseDrag: three_item_show > 3 ? true : false,
		loop: three_item_show > 3 ? true : false,
		autoplay: three_item_show > 3 ? 3000 : false,
		autoplayHoverPause: three_item_show > 3 ? true : false,
		responsive: {
			0: {
				items: 1
			},
			600: {
				items: 1
			},
			768: {
				items: 2
			},
			1000: {
				items: 3
			}
		}
	});

	
	$('.role-box .panel-collapse').on('show.bs.collapse', function () {
		$(this).siblings('.panel-heading').addClass('active');
	  });
	  $('.role-box .panel-collapse').on('hide.bs.collapse', function () {
		$(this).siblings('.panel-heading').removeClass('active');
	  });
	
	  //screenWidth();


	//   Ripple effects
	  $(".ripple_hover").on({
		mouseenter: function (e) {
			if ($(this).find(".ripple_effect").length === 0) {
				$(this).append("<span class='ripple_effect'></span>");
			}
			var rip = $(this).find(".ripple_effect");
			rip.removeClass("animate");
			if (!rip.height() && !rip.width()) {
				var d = Math.max($(this).outerWidth(), $(this).outerHeight());
				rip.css({ height: d, width: d });
			}
			var x = e.pageX - $(this).offset().left - rip.width() / 2;
			var y = e.pageY - $(this).offset().top - rip.height() / 2;
			rip.css({ top: y + "px", left: x + "px" }).addClass("ripple_animate");
		},
		mouseleave: function (e) {
			var rip = $(this).find(".ripple_effect");
			var x = e.pageX - $(this).offset().left - rip.width() / 2;
			var y = e.pageY - $(this).offset().top - rip.height() / 2;
			rip.css({ top: y + "px", left: x + "px" }).removeClass("ripple_animate");
		},
  	});


		//Maps Pointer
		var clicked = false;
		$('.pointer a.click_pointer').on('click', function () {
			// $('.labal-copy').css('display','none');
			if (clicked == false) {
				$(this).parent().find('.labal-copy').css('display', 'block');			 
				clicked = true;
			} else {
				$('.labal-copy').css('display', 'none');
				clicked = false;
			}

			return false;
		});
		$('.labal-copy .close-btn').on('click', function () {
			$(this).parent().css('display', 'none');
			clicked = false;
			return false;
		});

	

	//END
});
