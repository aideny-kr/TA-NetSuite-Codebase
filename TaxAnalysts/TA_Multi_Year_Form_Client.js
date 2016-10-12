/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       31 Mar 2015     huichanyi
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
function pricingSelectionChange(type, name, linenum){

	var pricingSelection = nlapiGetFieldValue('pricingmodel');
	var firstYearPrice = nlapiGetField('firstyearprice');
	var secondYearPrice = nlapiGetField('secondyearprice');
	var thirdYearPrice = nlapiGetField('thirdyearprice');
	var fourthYearPrice = nlapiGetField('fourthyearprice');
	var fifthYearPrice = nlapiGetField('fifthyearprice');
	var length = nlapiGetFieldValue('contractlength');
	var uplift = nlapiGetField('uplift');
	

	if(name == 'contractlength'){
		nlapiSetFieldValue('pricingmodel', '', true, true);
	}	
	if(name == 'pricingmodel'){

		if(pricingSelection == '1'){ 
			uplift.setDisplayType('normal');
			secondYearPrice.setDisplayType('disabled');
			thirdYearPrice.setDisplayType('disabled');
			fourthYearPrice.setDisplayType('disabled');
		}else if(pricingSelection == '3'){
			uplift.setDisplayType('disabled');
			switch(length){
			case '24':
				secondYearPrice.setDisplayType('normal');
				break;
			case '36':
				secondYearPrice.setDisplayType('normal');
				thirdYearPrice.setDisplayType('normal');
				break;
			case '48':
				secondYearPrice.setDisplayType('normal');
				thirdYearPrice.setDisplayType('normal');
				fourthYearPrice.setDisplayType('normal');
				break;
			case '60':
				secondYearPrice.setDisplayType('normal');
				thirdYearPrice.setDisplayType('normal');
				fourthYearPrice.setDisplayType('normal');
				fifthYearPrice.setDisplayType('normal');
				break;
			}
		}else{
			uplift.setDisplayType('disabled');
			secondYearPrice.setDisplayType('disabled');
			thirdYearPrice.setDisplayType('disabled');
			fourthYearPrice.setDisplayType('disabled');
			fifthYearPrice.setDisplayType('disabled');
		}
	}
}
