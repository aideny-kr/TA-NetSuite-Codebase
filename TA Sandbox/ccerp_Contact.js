/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Feb 2015     Dana
 *
 */


function ta_Contact_fieldChanged(type, name){
	nlapiLogExecution('DEBUG', 'ta_Contact_fieldChanged', 'Field Changed.');
	nlapiLogExecution('DEBUG', 'ta_Contact_fieldChanged', 'type = ' +type);
	if(type != 'create'){
		if(name == 'email' || name == 'firstname' || name == 'lastname'){
			nlapiLogExecution('DEBUG', 'ta_Contact_fieldChanged', name + ' has been changed');
			nlapiSetFieldValue('custentity_update_web_user', 'T', true, true);
		}
	}
}

function ccerp_contactBeforeLoad(type, form, request){
	nlapiLogExecution('debug','contactBeforeSubmit '+type);
	if (type == 'create'){	
		if (isNotEmpty(request)){
			var custid = request.getParameter('custrecord_contractuser_customer');
			if (isNotEmpty(custid)){
				nlapiSetFieldValue('company',custid);
				nlapiSetFieldValue('contactrole','2');
			}
		}
	}	
}


function ccerp_contactBeforeSubmit(type){
	nlapiLogExecution('debug','contactBeforeSubmit '+type);
	var user = nlapiGetUser();
	var context = nlapiGetContext();
	var executioncontext = context.getExecutionContext();
	nlapiLogExecution('debug','executioncontext '+executioncontext);
	var regattJSON = nlapiGetFieldValue('custentity_reg_att_json');
	if (type == 'edit' && isNotEmpty(regattJSON) && executioncontext == 'webservices'){
		var conid = nlapiGetRecordId();
		nlapiLogExecution('debug','regattJSON before Reg Exp, '+conid,regattJSON);
		
		// fixes double string issues
		regattJSON = regattJSON.replace(/\""/g, '"');
		regattJSON = regattJSON.replace(/ : ",/g, ' : "",');
		regattJSON = regattJSON.replace(/ : "}/g, ' : ""}');
		
		nlapiLogExecution('debug','regattJSON after Reg Exp, '+conid,regattJSON);
		nlapiLogExecution('debug', 'regattJSON type ', 'contact id = ' +conid+ ', type = ' + typeof(regattJSON));
		if(typeof(regattJSON) == 'string'){
			var regattval = JSON.parse(regattJSON);
		}
		var custrecord_eventreg_eventuserid = regattval.custrecord_eventreg_eventuserid;
		
		
		//Search for existing records if results load record else create
		var filters = new Array();
	    filters.push(new nlobjSearchFilter('custrecord_eventreg_eventuserid', null, 'is', custrecord_eventreg_eventuserid));
	    var searchresults = nlapiSearchRecord('customrecord_eventreg',null,filters);
	    //nlapiLogExecution('debug','searchresults.length '+searchresults.length);
	    var regattrec ='';
	    if (isEmpty(searchresults))
	    	regattrec = nlapiCreateRecord('customrecord_eventreg');
	    else {
	    	var regattid = searchresults[0].getId();
	    	regattrec = nlapiLoadRecord('customrecord_eventreg',regattid);
	    }
	    for (var fld in regattval){
	    	var val = regattval[fld];
	    	if (isEmpty (val)){
	    		continue;
	    	}	
	    	else if (fld == 'custrecord_eventreg_eventid'){
	    		regattrec.setFieldText(fld,val);
	    		//nlapiLogExecution('debug','71 '+fld,val);
	    	}
	    	/*else if (fld == 'custrecord_eventreg_firstname' || fld == 'custrecord_eventreg_lastname'){
	    		val = titleCaps(val);
	    		regattrec.setFieldValue(fld,val);
	    		nlapiLogExecution('debug','59 '+fld,val);
	    	}*/	
	    	else{
	    		regattrec.setFieldValue(fld,val);
	    		//nlapiLogExecution('debug','79 '+fld,regattval[fld]);
	    	}
	    }
	    var taEventid = regattrec.getFieldValue('custrecord_eventreg_eventid');
	    nlapiLogExecution('debug','taEventid '+taEventid);
	    var taEventdate = nlapiLookupField('customrecord_taevent',taEventid,'custrecord_taevent_eventtime');
	    regattrec.setFieldValue('custrecord_eventreg_showtime',ccerpCustomLocalTimeStamp2(new Date(taEventdate)));
	    regattrec.setFieldValue('custrecord_eventreg_showtitle','Weekly Tax Update | '+ ccerpCustomLocalTimeStamp2(new Date(taEventdate))+' | '+ccerpCustomLocalTimeStamp1(new Date(taEventdate)));
	    regattrec.setFieldValue('custrecord_regatt_contact',conid);
	    var regrec = nlapiSubmitRecord(regattrec);
	    nlapiLogExecution('debug','regrec ',regrec);
	}
}


function ta_Contact_AfterSubmit(type) {
	nlapiLogExecution('debug', 'taContact_AfterSubmit', 'After Submit Script Begins');
	var contactId = nlapiGetRecordId();
	var currContext = nlapiGetContext();
	var executionContext = currContext.getExecutionContext();
	
		if(type == 'create'){
			nlapiSubmitField('contact', contactId, 'custentity_update_web_user', 'F');	
		}
		if(type == 'edit' || type == 'xedit'){
			// checking update user flag
			var checkFlag = nlapiGetFieldValue('custentity_update_web_user');
			if(checkFlag == 'T'){
				var customerId = nlapiGetFieldValue('companyid');
				
				var firstName = nlapiGetFieldValue('firstname');
				var lastName = nlapiGetFieldValue('lastname');
				var email = nlapiGetFieldValue('email');
				
				var schedParams = [];
				schedParams['custscriptcontactid'] = contactId;	
				schedParams['custscriptfirstname'] = firstName;
				schedParams['custscriptlastname'] = lastName;
				schedParams['custscriptemail'] = email;
			
				// run scheduled script
				nlapiScheduleScript('customscript_webuser_update_sched', 'customdeploy1', schedParams);
				// removing update user flag
				nlapiSubmitField('contact', contactId, 'custentity_update_web_user', 'F');	
				// redirect the user 
				nlapiSetRedirectURL('RECORD', 'customer', customerId, false);
		}
	}
}



function ta_ContactScheduled(type) {
	nlapiLogExecution('debug', 'taContactScheduled Begins');
	nlapiLogExecution('debug', 'taContactScheduled', 'type = '+type);

//	var context = nlapiGetContext();
//	var contractIds = context.getSetting('SCRIPT', 'custscript_cu_contractids');
//	var contractId = context.getSetting('SCRIPT', 'custscript_cu_contractid');
//	var enddate = context.getSetting('SCRIPT', 'custscript_cu_enddate');

	// passing parameters to variables 	
	var context = nlapiGetContext();
	var contactId = context.getSetting('SCRIPT', 'custscriptcontactid');
	var firstName = context.getSetting('SCRIPT', 'custscriptfirstname');
	var lastName = context.getSetting('SCRIPT', 'custscriptlastname');
	var email = context.getSetting('SCRIPT', 'custscriptemail');
	
	nlapiLogExecution('debug', 'parameters', "contactId = " +contactId);
	var searchFilter = [];
	searchFilter.push(new nlobjSearchFilter('custrecord_contractuser_contact', null, 'is', contactId));
	var searchResult = nlapiSearchRecord('customrecord_contractuser', 'customsearch_chan_contact_info_change', searchFilter);
	if(isNotEmpty(searchResult)){
		for(var i = 0; i < searchResult.length; i++){
			var webuserId = searchResult[i].getId();
			var webuserRec = nlapiLoadRecord('customrecord_contractuser', webuserId);
			webuserRec.setFieldValue('custrecord_contractuser_firstname', firstName);
			webuserRec.setFieldValue('custrecord_contractuser_lastname', lastName);
			webuserRec.setFieldValue('custrecord_contractuser_email', email);
			nlapiSubmitRecord(webuserRec, false, true);
		}
	}
}

// function to receive last access information.

function taContactUpdateREST(datain) {
	nlapiLogExecution('debug', 'Data In (JSON)', JSON.stringify(datain));
	
	try{
		var contactId = datain.id_contact;
		var lastAccess = moment.unix(datain.last_access).format("MM/DD/YYYY h:mm:ss a");
		
		var lastAccessAdj = moment(lastAccess).add(3, 'hours');
		var lastAccessFormatted = lastAccessAdj._d;
	
		nlapiLogExecution('DEBUG', 'taContactUpdateREST', 'Contact Id: ' + contactId + ', lastAccess: ' + lastAccessAdj._d);
		nlapiSubmitField('contact', contactId, 'custentity_last_taxnotes_access_time', nlapiDateToString(lastAccessFormatted, 'datetime'));
		
		return {"status":"success", 'id_contact':contactId}
		
	}catch(e){
		nlapiLogExecution('debug', 'Exception', e);
		var err = {};
		err.status = 'Fail';
		err.details = e.getDetails();
		return err;
	}
}

