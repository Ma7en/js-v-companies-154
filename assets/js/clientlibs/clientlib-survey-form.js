var survID = '';
var isResetCookie = '';
var surveyWidth='';
var radioOptions=[];
var surveyURL = '';
var cookieName='';
$(document).ready(function() {
	surveyWidth = $(".fixed-box").width();
	$(".survey-open").hide();
	$(".progress-wrap").hide();
	$(".survey-close").click(function(){
		$(".fixed-box").animate({ width: 30 });
		$(".survey-close").hide();
		$(".survey-open").fadeIn();
	});
	$(".survey-open").click(function(){
		$(".fixed-box").animate({ width: surveyWidth });
		$(".survey-open").hide();
		$(".survey-close").show();
	});

});


window.onload = function() {
    var percentList=[];
    var location;
	var optionsAvailable;
	var surveyData=[];
	var percentOfAns;    
    var selectedAnswer; 


	/* Fetch the selected option provided by user */
	var windowPath = window.location.pathname;
	var pagePath = windowPath.split('.');
    var arrPage = pagePath[0].split('/');
    var pageName = arrPage[arrPage.length-1];
    cookieName = "Survey-" + pageName;
   	radioOptions  = document.getElementsByName('optradio');
    for(counter=0; counter<radioOptions.length; counter++)
	{
         surveyData.push(radioOptions[counter].value);
    } 
	surveyData = surveyData.join(","); 
	var surveyCookie = GetCookie(cookieName);
	var epochStamp;
    if(surveyCookie != ''){
		epochStamp = surveyCookie;
	}
	else{
		epochStamp = Date.now();
	}  
    console.log('call from survey js');
 	 $.ajax({
            url:"/bin/infosys/surveyform",
            dataType:'JSON',
            data:{cookieStamp:epochStamp,                  
                  pagePath:pagePath[0]
             },
            async:false, 
            type:'get',
            cache:false,
            success:function(response){
                survID = response.surveyID;
		        isResetCookie = response.resetCookie;
		        surveyURL = response.surveyURL;
            },
            error:function(){
            }
         }
     );


	if(surveyCookie != '' && isResetCookie == 'false'){
	    $.ajax({
		type:'get',
		url:"/bin/infosys/savecareersurvey",
		data:{surveyID:survID,surveyResponse:'',userLocation:'', surveyOptions:surveyData},
		contentType:"application/json",
		dataType:"json",
		success:function(response){
			console.log('survey call success');
			percentList = response.percentageList;
            ShowResults(percentList);
		},
		fail: function(xhr, textStatus, errorThrown){
       			//console.log(xhr.responseText);
    	}
	});

    } 
	else if(surveyCookie != '' && isResetCookie == 'true')
	{
		DeleteCookie(cookieName);

        ShowSurvey();
	}
	else if(surveyCookie == '')
	{
        ShowSurvey();
	}


$(".survey-submit").click(function() {
     selectedAnswer = $("input[name='optradio']:checked").val(); 
    /* AJAX call to fetch user location */
      $.ajax({
            url:"https://api.company-target.com/api/v2/ip.json?key=ecd325f602e15bcb43e9ef52ef561150",
            async:false, 
            type:'get',
            cache:false,
            success:function(response){
                 location = response.city +" , "+ response.state;
            },
            error:function(){
            }
         }
    );

    if(selectedAnswer) {
	 if(survID!='')
	 {
    /* AJAX call to save user response */
	  $.ajax({
		type:'get',
		url:"/bin/infosys/savecareersurvey",
		data:{surveyID:survID,surveyResponse:selectedAnswer,userLocation:location, surveyOptions:surveyData},
		contentType:"application/json",
		dataType:"json",
		success:function(response){
			console.log('survey call success');
			percentList = response.percentageList;
            ShowResults(percentList);
		},
		fail: function(xhr, textStatus, errorThrown){
       			//console.log(xhr.responseText);
    	}
	});


	 }
    }
});


}

function ShowResults(graphPercent)
{
/* Find each option's percentage and update progress bar */
      for(var i=0; i<graphPercent.length; i++)
	  {
         var x = radioOptions[i].value.toLowerCase().replace(/ +/g, "");
         $('.option'+i).attr('aria-valuenow', graphPercent[i]) + "%";
         var extension = i + 1;
         document.getElementsByClassName("option"+i)[0].classList.remove("bar-color-q1");
		 document.getElementsByClassName("option"+i)[0].classList.add("bar-color-q"+extension);
    	 $('#option'+i).text(parseInt(graphPercent[i], 10)+'%');
 		 $('.option'+i).css("width", graphPercent[i]+'%');   
         $('.option'+i).css("min-width", '12%'); 
	 if(graphPercent[i]<1)
         {
			$('.option'+i).css("background", 'none'); 
         }
      }  

	  SetCookie(cookieName);	

      //change background color after submit
		$(".fixed-box").addClass("change-bg");
		$(".survey-submit").hide();
		$(".progress-wrap").show();
		$(".fix-list").hide();
		$(".survey-progress .progress .progress-bar").css("width", function() {
			return $(this).attr("aria-valuenow") + "%";
		});
		$(".fixed-box").show();
}
function ShowSurvey()
{
	//change background color after submit
		if($(".fixed-box").hasClass("change-bg"))
		{
			$(".fixed-box").removeClass("change-bg");
		}
		$(".survey-submit").show();
		$(".progress-wrap").hide();
		$(".fix-list").show();
		$(".fixed-box").show();
}

function GetCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function SetCookie(name)
{
	var timestamp = Date.now(); 
	  var exp = new Date();
	  exp.setFullYear(exp.getFullYear()+1);
	  document.cookie = name+"=" + timestamp +"; expires="+ exp +"; path=/";
}

function DeleteCookie(name) {
  document.cookie = name +'=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

