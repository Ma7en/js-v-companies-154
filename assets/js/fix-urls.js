window.addEventListener("load", function() {
	var array = document.querySelectorAll("a[target='_blank'][href^='http'],[target='_blank'][href^='https']");
	array.forEach(function(item) {
		item.setAttribute("rel", "noopener noreferrer");
	});
});

/* ANTI-CLICKJACKING SCRIPT -START */
var canonicalUrl = "";
var domain=location.hostname;
console.log(domain);
var isEditMode = false;
var currUrl = document.referrer;
if(null!=document.querySelector("link[rel='canonical']"))
{
	canonicalUrl=document.querySelector("link[rel='canonical']").getAttribute("href");
}
if(currUrl.includes("/editor.html/"))
{
	isEditMode=true;
}
if (self !== top && !isEditMode && ("" == domain || "" == canonicalUrl || !canonicalUrl.includes(domain))){
	var css = 'body { display: none !important }',
    head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style');
	head.appendChild(style);

	style.type = 'text/css';
	if (style.styleSheet){
		// This is required for IE8 and below.
		style.styleSheet.cssText = css;
	} else {
		style.appendChild(document.createTextNode(css));
	}
	console.log("ACJS running");
}
else{
	console.log("ACJS deferred");
}

/* ANTI-CLICKJACKING SCRIPT -END */
