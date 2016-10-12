/**
* Copyright (c) 1998-2013 NetSuite, Inc.
* 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
* All Rights Reserved.
*
* This software is the confidential and proprietary information of
* NetSuite, Inc. ("Confidential Information"). You shall not
* disclose such Confidential Information and shall use it only in
* accordance with the terms of the license agreement you entered into
* with NetSuite.


* Tax Analyst Create Contract
*  
* @author Nowell Hernandez
* @version 1.0
*  
*/
function userEventAfterSubmit(type){
	try{
		if(type != 'create' && type != 'edit')
		{
			return;
		}
		nlapiLogExecution('DEBUG', 'ACTIVITY', 'Script Started...');
		nlapiLogExecution('DEBUG', 'VALUE', 'SO ID: '+nlapiGetRecordId());
		var recSO = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
		
		var stCurrContractId = recSO.getFieldValue('custbody_contract_name');
		var stPriorContractId = recSO.getFieldValue('custbody_swe_from_contract');
		
		nlapiLogExecution('DEBUG', 'VALUE', 'Current Contract = ' + stCurrContractId + ' | Prior Contract = ' + stPriorContractId);
		if(stCurrContractId && stPriorContractId)
		{
			nlapiSubmitField('customrecord_contracts', stCurrContractId, 'custrecord_swe_prior_yr_contract', stPriorContractId);
		}
		
//		if(recSO.getFieldValue('customform') == nlapiGetContext().getSetting('SCRIPT', 'custscript_form') && recSO.getFieldValue('custbody_contract_name'))
//		{
//			var recContract = nlapiCopyRecord('customrecord_contracts', recSO.getFieldValue('custbody_contract_name'));
//			recContract.setFieldValue('custrecordcustrecord_swe_prior_yr_contra', recSO.getFieldText('custbody_contract_name'));
//			var strContractID = nlapiSubmitRecord(recContract, true, true);
//			nlapiLogExecution('DEBUG', 'VALUE', 'Contract ID: '+strContractID);
//		}
//		var arrResult = nlapiSearchRecord('customrecord_contracts', null, new nlobjSearchFilter('custrecord_contract_renewal_tran', null, 'is', nlapiGetRecordId()));
//		if(arrResult)
//		{
//			nlapiSubmitField('customrecord_contracts', arrResult[0].getId(), 'custrecord_swe_prior_yr_contract', recSO.getFieldText('custbody_contract_name'));
//		}
		nlapiLogExecution('DEBUG', 'ACTIVITY', 'Script Ended Sucessfully');
	}catch(error)
	{
		if (error.getDetails != undefined) 
  	   {
  		   nlapiLogExecution('ERROR', 'Process Error', error.getCode() + ': ' + error.getDetails());
  		   throw error;
  	   }
  	   else 
  	   {    
  		   nlapiLogExecution('ERROR', 'Unexpected Error', error.toString());
  		   throw nlapiCreateError('99999', error.toString());
  	   }
	}
}
