/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       29 Jul 2015     huichanyi
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */


function freeTrialPageInit(type){
	AddJavascript('https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js', 'head');
	AddStyle('https://system.na1.netsuite.com/core/media/media.nl?id=460245&c=1257021&h=1dfd9023815b08328aab&_xt=.css','head');
	//https://system.sandbox.netsuite.com/core/media/media.nl?id=374794&c=1257021&h=6ab4b83e5a108605ad5d&_xt=.css
	
	var downloadLink = document.getElementById("csv_download_val").childNodes;
	downloadLink[0].style.color = "#69B578";
	downloadLink[0].style.fontSize = "15px";
	
	//document.getElementById("current_items").readOnly = true;
	
	var fileField = document.getElementById("csv_file_fs");
	fileField.onchange = function() { 
		var submitBtn = document.getElementById("submitter");
		submitBtn.click();
	}
	
}

function freeTrialSaveRecord(){
	if(!isNotEmpty(nlapiGetFieldValue('csv_file'))){
		var emptyField = 0;
		var count = nlapiGetLineItemCount('new_webuser');
		nlapiLogExecution('DEBUG', 'freeTrial_OnSave', 'count = ' + count);
		var startdate = nlapiGetFieldValue('startdate');
		var enddate = nlapiGetFieldValue('enddate');
		var items = nlapiGetFieldValues('item_select');
		if(isNotEmpty(startdate) && isNotEmpty(enddate) && isNotEmpty(items)){		

			for(var i = 1; i <= count; i++ ){
				var emailFld = nlapiGetLineItemValue('new_webuser', 'new_webuser_email', i);
				var fnameFld = nlapiGetLineItemValue('new_webuser', 'new_webuser_firstname', i);
				var lnameFld = nlapiGetLineItemValue('new_webuser', 'new_webuser_lastname', i);
				if(!isNotEmpty(emailFld) || !isNotEmpty(fnameFld) || !isNotEmpty(lnameFld)){
					emptyField++;
				}
			}
			nlapiLogExecution('DEBUG', 'freeTrial_OnSave', 'Empty Fields = ' + emptyField);
			if(emptyField > 0){
				swal("There was an error", "Please check your list again", "error");
				return false;
			}else{
				swal("Success", "Your free trial users will be added soon", "success");
				return true;
			}
		}else {
			swal("Please fill in all required fields", "Start Date, End Date and Items are required", "error");
			return false;
		}
	}else{
		swal("Loading your file!", "Please wait", "success");
		return true;
	}
}

function AddJavascript(jsname, element) {
	var tag = document.getElementsByTagName(element)[0];
	var addScript = document.createElement('script');
	addScript.setAttribute('type', 'text/javascript');
	addScript.setAttribute('src', jsname);
	tag.appendChild(addScript);
}

function AddStyle(csslink, element) {
	var tag = document.getElementsByTagName(element)[0];
	var addLink = document.createElement('link');
	addLink.setAttribute('type', 'text/css');
	addLink.setAttribute('rel', 'stylesheet');
	addLink.setAttribute('href', csslink);
	tag.appendChild(addLink);
}

