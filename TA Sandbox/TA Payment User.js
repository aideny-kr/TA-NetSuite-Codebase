/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       02 May 2016     Chan
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */


function taUserAfterSubmit(type){
	/**
	 * If new payment is applied 
	 */
	if(type == 'create') {
	  
  }
}
