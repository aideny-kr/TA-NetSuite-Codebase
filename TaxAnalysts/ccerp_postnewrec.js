/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       14 May 2014     CCERP
 *
 */

function postNewRecord_RESTlet(datain) {
	
	// External URL https://rest.na1.netsuite.com/app/site/hosting/restlet.nl?script=113&deploy=1
	
	// datain Object:
	/*var datain = {
	 * 		"ccsecuritycode" : "1234",
	 * 		"recordId" : "11111",
			"recordtype" : "lead",
			"email" : "test@test.com",
			"firstname" : "Test",
			"lastname" : "Test",
			"phone" : "520"
		};*/
	
	/*
	 * {
	"action": "TNL"
	"recordtype" : "customer",
	"email" : "test@test.com",
	"phone" : "xxx-xxx-xxxx"
    "isperson": "T",
    "firstname": "First Name",
    "lastname": "Last Name",
    "creditcards": [{
        "ccdefault": "T",
        "paymentmethod": "credit card type",
        "ccnumber": "credit card number",
        "ccexpiredate": "MM/YYYY",
        "ccname": "Card Holder Name"
    }],
    "addressbook": [{
        "defaultbilling": "T",
        "addressbookaddress": {
            "addressee": "Customer Name",
            "addr1": "address",
            "city": "city",
            "state": "state",
            "zip": "zip"
        }
    }]
}

	 */
	
	var nlobj = '';
	var err = new Object();
	
	nlapiLogExecution('debug', 'postNewRecord_RESTlet', 'BEGIN');
	
	nlapiLogExecution('debug', 'postNewRecord_RESTlet', 'datain '+JSON.stringify(datain));

	// Validate if mandatory record type is set in the request
	if (!datain.recordtype) {
		err.status = 'Fail';
		err.code = 'Missing Required Field';
		err.details = 'recordtype';
		return err;
	}

	try{
		var record = '';
		if(datain.recordid)
			record = nlapiLoadRecord(datain.recordtype,datain.recordid);
		else
			record = nlapiCreateRecord(datain.recordtype);
		
		for (var fieldname in datain) {
			if (datain.hasOwnProperty(fieldname)){
				if (fieldname != 'recordtype' && fieldname != 'recordid' && fieldname != 'action' && fieldname != 'lastname') {
					if (fieldname == 'firstname'){
						record.setFieldValue('companyname',datain.creditcards.ccname);
					}
					if (fieldname == 'creditcards'){
						var count = nlapiGetLineItemCount('creditcards');
						if (count > 0){
							for (var i = 1; i <= count; i++){
								nlapiRemoveLineItem('creditcards',i);
							}
						}
						record.selectNewLineItem('creditcards');
							for(var ccFld in datain.creditcards){
								record.setCurrentLineItemValue('creditcards',ccFld,datain.creditcards[ccFld]);
							}
						record.commitLineItem(fieldname);
					}
					else if (fieldname == 'addressbook'){
					record.selectNewLineItem(fieldname);
						for(var addrFld in datain.addressbook){
							if (addrFld == 'addressbookaddress'){
								var subrec = record.createCurrentLineItemSubrecord(fieldname, addrFld);
								subrec.setFieldText('country', 'United States');
								for(var addrBkaddrFld in datain.addressbook.addressbookaddress){
									subrec.setFieldValue(addrBkaddrFld,datain.addressbook.addressbookaddress[addrBkaddrFld]);
								}
								subrec.commit();	
							}
							else{
								record.setCurrentLineItemValue(fieldname,addrFld,datain.addressbook[addrFld]);
							}
						}
						record.commitLineItem(fieldname);
					}
					else{
						var value = datain[fieldname];
						// ignore other type of parameters
						if (value && typeof value != 'object')
							record.setFieldValue(fieldname, value);
					}
				}
			}
		}
		var recordId = nlapiSubmitRecord(record);
		nlapiLogExecution('DEBUG', 'postNewRecord_RESTlet', 'record id ' + recordId);
		
		/////////////Post new record Actions////////////////////
		/*
		 * 1 FREE TRIAL - Create Free Trial User
		 * 2 TNLCC - Create TNLCC Reg Salses order and Web User ///Set getauth == 'T' on SO///
		 */
		
		////////////////////////Create Free Trial Contract User.//////////////////////
		if (datain.action == 'FREE TRIAL'){
		var ftPrefFlds = ['custrecord_freetrialpref_active','custrecord_freetrialpref_duration','custrecord_freetrialpref_item'];
		var ftPrefVals = nlapiLookupField('customrecord_freetrialpref','1',ftPrefFlds);
		var active = ftPrefVals['custrecord_freetrialpref_active'];
		nlapiLogExecution('debug', 'active ' + active);
			if (active == 'T'){
				//Get the free trial info
				nlapiLogExecution('debug','Creating Free Trial');
				var ftPrefDuration = ftPrefVals['custrecord_freetrialpref_duration'];
				var ftPrefItems = ftPrefVals['custrecord_freetrialpref_item'];
				if (ftPrefItems);
					ftPrefItems=ftPrefItems.split(',');
				nlapiLogExecution('debug','ftPrefItems '+ftPrefItems);
				var ftPrefItemArr = [];
				ftPrefItemArr.push(ftPrefItems);
				
				//Create Contact Record - *******NEED TO REMOVE********
				/*var conrec = nlapiCreateRecord('contact');
				conrec.setFieldValue('firstname',datain.firstname);
				conrec.setFieldValue('lastname',datain.lastname);
				conrec.setFieldValue('company',recordId);
				conrec.setFieldValue('email',datain.email);
				var conid = nlapiSubmitRecord(conrec);
				nlapiLogExecution('debug','conid ',conid);
				*/
				//Create free trial Contract User Record
				var curec = nlapiCreateRecord('customrecord_contractuser');
				curec.setFieldValue('custrecord_contractuser_customer',recordId);
				curec.setFieldValue('custrecord_contractuser_contact',conid);
				curec.setFieldValues('custrecord_contractuser_items',ftPrefItems);
				curec.setFieldValue('custrecord_contractuser_firstname',datain.firstname);
				curec.setFieldValue('custrecord_contractuser_lastname',datain.lastname);
				curec.setFieldValue('custrecord_contractuser_email',datain.email);
				curec.setFieldValue('custrecord_contractuser_startdate',nlapiDateToString(new Date()));
				curec.setFieldValue('custrecord_contractuser_endate',nlapiDateToString(adddays(new Date(),ftPrefDuration)));
				curec.setFieldValue('custrecord_contractuser_activeflag','T');
				curec.setFieldValue('custrecord_contractuser_freetrial','T');
				var cuid = nlapiSubmitRecord(curec);
				nlapiLogExecution('debug','cuid ',cuid);
				nlobj = nlapiLoadRecord(datain.recordtype, recordId);
			}
		}
		
		/////////////Create TNLCC Reg Salses order and Web User ///
		else if (datain.action == 'TNLCC'){
			var custrec = nlapiLoadRecord('customer',recordId);
			var ccline = custrec.getLineItemCount('creditcards'); 
			var ccid = custrec.getLineItemValue('creditcards','internalid',ccline);
			var startdate = nlapiDateToString(new Date());
			var enddate = nlapiDateToString(nlapiAddDays(nlapiStringToDate(startdate),365));			
			nlapiLogExecution('debug','Startdate',startdate);
			nlapiLogExecution('debug','enddate',enddate);
			
			//Create Sales Order and transform to Cash Sale
			var sorec = nlapiCreateRecord('salesorder',{recordmode: 'dynamic'});
			sorec.setFieldValue('custbody_end_user',recordId);
			sorec.setFieldValue('entity',recordId);
			//sorec.setFieldValue('creditcard',ccid);
			//sorec.setFieldValue('ccsecuritycode',datain.ccsecuritycode);
			sorec.setFieldValue('custbody_order_type',1);
			sorec.setFieldValue('startdate',startdate);
			sorec.setFieldValue('enddate',enddate);
			sorec.setFieldValue('custbody_tran_term_in_months','12');
			sorec.setFieldValue('orderstatus','B');//Pending Fulfillment
			sorec.setFieldValue('getauth','T');
			sorec.selectNewLineItem('item');
			sorec.setCurrentLineItemValue('item','item','2068');
			sorec.setCurrentLineItemValue('item','custcol_swe_contract_end_date',enddate);
			sorec.setCurrentLineItemValue('item','custcol_swe_contract_start_date',startdate);
			sorec.setCurrentLineItemValue('item','custcol_swe_contract_item_term_months','12');
			sorec.commitLineItem('item');
			var soid = nlapiSubmitRecord(sorec);
			nlapiLogExecution('debug','soid',soid);
//			var fils = [];
//			var cols = [];
//			fils.push(new nlobjSearchFilter('internalid',null, 'anyof', soid));
//			fils.push(new nlobjSearchFilter('paymenteventholdreason',null, 'noneof', '@NONE@'));
//			var results = nlapiSearchRecord('transaction',null, fils,cols);
//			if (isNotEmpty(results)){
//				var contractId = nlapiLookupField('transaction',soid,'custbody_contract_name');
//				nlapiDeleteRecord('salesorder',soid);
//				nlapiDeleteRecord('customrecord_contracts',contractId);
//				//nlapiSubmitField('customrecord_contractuser',cuid,'isinactive','T');//after testing change 
//				//Run search to delete web user items and web user
//				var nlobj = {'status':'Credit Card Failed'};
//				nlapiLogExecution('debug', 'Holdreason obj', JSON.stringify(nlobj));
//				return nlobj;
//			}
			var invRec = nlapiTransformRecord('salesorder',soid,'invoice');
			var contract = invRec.getFieldValue('custbody_contract_name');
			var invid = nlapiSubmitRecord(invRec);
			
			// sending receipt to the customer  
//			var attachment =[];
//			var mergeTemplate;
//			var csStatus = nlapiLookupField('cashsale', csid, 'status');
//			
//			if(csStatus == 'notDeposited'){
//				var csFileObj = nlapiPrintRecord('transaction', csid, 'PDF');
//				var tranid = nlapiLookupField('cashsale', csid, 'tranid');
//				csFileObj.setName("Receipt -" + tranid + ".pdf");
//				attachment.push(csFileObj);
//				mergeTemplate = '28';
//				var emailCustomer = nlapiLookupField('cashsale', csid, 'entity');
//				var emailMerger = nlapiCreateEmailMerger('28');
//				
//				emailMerger.setRecipient('customer', emailCustomer);
//				emailMerger.setTransaction(csid);
//				
//				var mergeResult = emailMerger.merge();
//				
//				nlapiSendEmail(92599, emailCustomer, mergeResult.getSubject(), 
//						mergeResult.getBody(), null, null, emailMerger, attachment);
//				
//			}
			
			
			//Create Web User
			var contactid = datain.contactid;
			var curec = nlapiCreateRecord('customrecord_contractuser');
			curec.setFieldValue('custrecord_contractuser_customer',recordId);
			curec.setFieldValue('custrecord_contractuser_contract',contract);
			curec.setFieldValue('custrecord_contractuser_contact',contactid);
			curec.setFieldValues('custrecord_contractuser_items',[2068]);
			curec.setFieldValue('custrecord_contractuser_firstname',datain.firstname);
			curec.setFieldValue('custrecord_contractuser_lastname',datain.lastname);
			curec.setFieldValue('custrecord_contractuser_email',datain.email);
			curec.setFieldValue('custrecord_contractuser_activeflag','T');
			curec.setFieldValue('custrecord_contractuser_chargecustomer',recordId);
			var cuid = nlapiSubmitRecord(curec);
			nlapiLogExecution('debug','cuid ',cuid);
			// Set up nlobj to send to drupal
			
			nlobj = {
				"cuid" : cuid,
				"contactid" : contactid,
				"ccid" : ccid
			};
		}
		//No action
		else{
			nlobj = nlapiLoadRecord(datain.recordtype, recordId);
		}
		return {'status':'success','record':nlobj};
	}
	catch(e){
		
		nlapiLogExecution('error', 'Exception', e);
		err.status = 'Fail';
		err.code = e.code;
		err.details = e.details;
		return err;
	}
}

