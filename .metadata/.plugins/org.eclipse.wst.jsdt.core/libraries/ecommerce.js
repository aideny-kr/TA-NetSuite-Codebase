/**
 * @projectDescription 2012.1 SuiteScript API (Last Updated on 09 Aug 2012)
 * @version 2012.2
 *
 * Known issues:
 * Windows->Preferences->JavaScript-<Editor->Content Assist
 * Insertion:
 * [ ] Guess filled function argument       (Must be turned off)
 */

/**
 * @returns {nlobjGetWebContainer} Web container
 */
function nlapiGetWebContainer() { };


/**
 * @returns {nlobjShoppingSession} Shopping session
 */
nlobjGetWebContainer.prototype.getShoppingSession = function() { };

/**
 * @returns {nlobjPageGenerator} Page generator
 */
nlobjGetWebContainer.prototype.getPageGenerator = function() { };

/**
 * @returns {nlobjStandardTagLibrary} Standard tag library
 */
nlobjGetWebContainer.prototype.getStandardTagLibrary = function() { };



/**
 * Get web store customer
 * @returns {nlobjWebStoreCustomer} Web store customer
 */
nlobjShoppingSession.prototype.getCustomer = function() { };

/**
 * Get web store order
 * @returns {nlobjWebStoreOrder} Web store order
 */
nlobjShoppingSession.prototype.getOrder = function() { };

/**
 * Gets all countries
 * API Governance: 10
 * @returns {Object[]}
 */
nlobjShoppingSession.prototype.getCountries = function() { };

/**
 * Gets attribute values for information items
 * API Governance: 10
 * @param {Object[]} infoItems Each object in array has values for field: <br><li>internalid
 * @returns {Object[]}
 */
nlobjShoppingSession.prototype.getInformationItemFieldValues = function(infoItems) { };

/**
 * Gets attribute values for items
 * API Governance: 10
 * @param {Object[]} items Each object in array has values for fields: <br><li>internalid <br><li>itemtype
 * @returns {Object[]}
 */
nlobjShoppingSession.prototype.getItemFieldValues = function(items) { };

/**
 * Gets attribute values for media items
 * API Governance: 10
 * @param {Object[]} mediaItems Each object in array has values for field: <br><li>internalid
 * @returns {Object[]}
 */
nlobjShoppingSession.prototype.getMediaItemFieldValues = function(mediaItems) { };

/**
 * Retrieves the password hint for email address provided.
 * @param {String} customerEmail [required] Customer email
 * @returns {String} Password hint
 */
nlobjShoppingSession.prototype.getPasswordHint = function(customerEmail) { };

/**
 * Get payment method
 * @param {String} paymentMethodId
 * @param {Object} fields [optional] Field object or array
 * @returns {Object}
 */
nlobjShoppingSession.prototype.getPaymentMethod = function(paymentMethodId, fields) { };

/**
 * Gets payment methods accepted by the Web store
 * API Governance: 10
 * @param {Object} fields [optional] Field object or array
 * @returns {Object[]}
 */
nlobjShoppingSession.prototype.getPaymentMethods = function(fields) { };

/**
 * Gets the array of related items for the item provided.
 * @param {Object} item [required] Object with values for fields
 * <br> - internalid [required]
 * <br> - itemtype [required]
 * @returns {Object[]} Array of related items
 */
nlobjShoppingSession.prototype.getRelatedItems = function(item) { };

/**
 * Gets countries to which the current site can ship
 * API Governance: 10
 * @returns {Object[]}
 */
nlobjShoppingSession.prototype.getShipToCountries = function() { };

/**
 * Returns a JSON object with the following fields:
 * <br> - internalid
 * <br> - name
 * <br> - symbol
 * <br> - precision
 * @returns {Object} JSON object
 */
nlobjShoppingSession.prototype.getShopperCurrency = function() { };

/**
 * Returns language locale as string
 * @returns {String} Language locale
 */
nlobjShoppingSession.prototype.getShopperLanguageLocale = function() { };

/**
 * Returns subsidiary id as string
 * @returns {String} Subsidiary id
 */
nlobjShoppingSession.prototype.getShopperSubsidiary = function() { };

/**
 * Gets the contents of the site category provided.
 * @param {Object} siteCategory [required] Object with values for field:
 * <br> - internalid [required]
 * @returns {Object}
 */
nlobjShoppingSession.prototype.getSiteCategoryContents = function(siteCategory) { };

/**
 * Gets attribute values of site category items
 * API Governance: 10
 * @param {Object[]} siteCategories Each object in array has values for field:
 * <br><li>internalid
 * @returns {Object[]}
 */
nlobjShoppingSession.prototype.getSiteCategoryFieldValues = function(siteCategories) { };

/**
 * Gets Web store settings
 * @param {Object} fields [optional] Field object or array
 * @returns {Object[]}
 */
nlobjShoppingSession.prototype.getSiteSettings = function(fields) { };

/**
 * Gets states and/or provinces
 * API Governance: 10
 * @returns {Object[]} Array of state/province names and state/province codes in the following format:
 * <br>{ "countrycode" : "US", "states" : [ {"Alabama" : "AL", ....... } ] }
 */
nlobjShoppingSession.prototype.getStates = function(country) { };

/**
 * Checks whether the customer is a guest or an existing customer.
 * @returns {Boolean}
 */
nlobjShoppingSession.prototype.isGuest = function() { };

/**
 * Checks whether the customer has logged in to the shopping session
 * @returns {Boolean}
 */
nlobjShoppingSession.prototype.isLoggedIn = function() { };

/**
 * Logs in a customer
 * API Governance: 20
 * @param {Object} customer Customer object (email, password)
 * @param {String} origin [optional] Use the origin parameter to ensure redirect to the correct URL after login. Possible parameter values are:
 * <br> - checkout (redirect to Checkout page)
 * <br> - customercenter (redirect to Customer Center)
 * <br> If parameter is not passed, redirect to Cart page.
 * @returns {Object} Object with the following fields:
 * <br><li>customerid - the internal id of the customer record for the logged in customer
 * <br><li>redirecturl - the URL to which user is redirected after logging in
 */
nlobjShoppingSession.prototype.login = function(customer, origin) { };

/**
 * Logs out a customer
 * @returns {Void}
 */
nlobjShoppingSession.prototype.logout = function() { };

/**
 * Used for integration with third party checkout providers such as Google Checkout and PayPal Express. Can only be called from a secure scheme (https).
 * @param {Object} checkoutSettings [required] Object with values for fields
 */
nlobjShoppingSession.prototype.proceedToCheckout = function(checkoutSettings) { };

/**
 * Registers and customer and logs in
 * API Governance: 20
 * @param {Object} customer Customer object with values for fields: (name, company, email, password, password2, passwordhint [optional], emailsubscribe [optional])
 * @returns {Object} Object with the following fields:
 * <br><li>customerid - the internal id of the record for the registered customer
 * <br><li>redirecturl - the URL to which user is redirected after registering
 */
nlobjShoppingSession.prototype.registerCustomer = function(customer) { };

/**
 * Registers a guest
 * API Governance: 20
 * @param {Object} guest Guest object with values for fields: (name, email, company [optional])
 * @returns {Object} Object with the following fields:
 * <br><li>customerid - the internal id of the record for the registered guest
 * <br><li>redirecturl - the URL to which user is redirected after registering
 */
nlobjShoppingSession.prototype.registerGuest = function(guest) { };

/**
 * Send password retrieval email to the email address provided.
 * @param {String} customerEmail [required] Customer email
 */
nlobjShoppingSession.prototype.sendPasswordRetrievalEmail = function(customerEmail) { };

/**
 * Sets shopper currency
 * API Governance: 10
 * @param {String} currency Currency
 * @returns {Void}
 */
nlobjShoppingSession.prototype.setShopperCurrency = function(currency) { };

/**
 * Sets shopper language locale
 * API Governance: 10
 * @param {String} languagelocale Language locale
 * @returns {Void}
 */
nlobjShoppingSession.prototype.setShopperLanguageLocale = function(languageLocale) { };

/**
 * Sets shopper subsidiary (for NetSuite OneWorld users)
 * API Governance: 10
 * @param {String} subsidiary Subsidiary
 * @returns {Void}
 */
nlobjShoppingSession.prototype.setShopperSubsidiary = function(subsidiary) { };



/**
 * Adds an address for the current customer
 * API Governance: 10
 * @param {Object} address Address object
 * @returns {Void}
 */
nlobjWebStoreCustomer.prototype.addAddress = function(address) { };

/**
 * Adds a credit card for the current customer
 * API Governance: 10
 * @param {Object} creditCard Credit card object
 * @returns {Void}
 */
nlobjWebStoreCustomer.prototype.addCreditCard = function(creditCard) { };

/**
 * Sends email to the current customer with the subject and body provided.
 * @param {String} subject [required] Subject
 * @param {String} body [required] Body
 */
nlobjWebStoreCustomer.prototype.emailCustomer = function(subject, body) { };

/**
 * Gets a specified address for the customer
 * API Governance: 10
 * @param {String} addressId Address id
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object}
 */
nlobjWebStoreCustomer.prototype.getAddress = function(addressId, fields) { };

/**
 * Gets the customer’s address book (set of addresses)
 * API Governance: 10
 * @param {Object} fields Fields object or array
 * @returns {Object}
 */
nlobjWebStoreCustomer.prototype.getAddressBook = function(fields) { };

/**
 * Gets a specified credit card for the customer
 * API Governance: 10
 * @param {String} creditCardId Credit card id
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object}
 */
nlobjWebStoreCustomer.prototype.getCreditCard = function(creditCardId, fields) { };

/**
 * Gets all of the customer’s credit cards
 * API Governance: 10
 * @param {Object[]} fields Fields object or array
 * @returns {Object}
 */
nlobjWebStoreCustomer.prototype.getCreditCards = function(fields) { };

/**
 * Gets custom fields for the customer record
 * @returns {Object[]}
 */
nlobjWebStoreCustomer.prototype.getCustomFields = function() { };

/**
 * Gets custom field values for the current customer
 * @returns {Object[]}
 */
nlobjWebStoreCustomer.prototype.getCustomFieldValues = function() { };

/**
 * Gets standard field values for the current customer
 * @param {Object} fields Field object or array
 * @returns {Object[]}
 */
nlobjWebStoreCustomer.prototype.getFieldValues = function(fields) { };

/**
 * Deletes a specified address
 * API Governance: 10
 * @param {String} addressId Address Id
 * @returns {Void}
 */
nlobjWebStoreCustomer.prototype.removeAddress = function(addressId) { };

/**
 * Deletes a specified credit card
 * API Governance: 10
 * @param {String} creditCardId Credit card Id
 * @returns {Void}
 */
nlobjWebStoreCustomer.prototype.removeCreditCard = function(creditCardId) { };

/**
 * Sets login credentials for current guest customer.
 * @param {Object} customer [required] Object with values for fields:
 * <br> - internalId [required]
 * <br> - email [required]
 * <br> - password [required]
 * <br> - passwordHint [optional]
 */
nlobjWebStoreCustomer.prototype.setLoginCredentials = function(customer) { };

/**
 * Updates a specified address
 * API Governance: 10
 * @param {Object} address Address object
 * @returns {Void}
 */
nlobjWebStoreCustomer.prototype.updateAddress = function(address) { };

/**
 * Updates a specified credit card for the current customer
 * API Governance: 10
 * @param {Object} creditCard Credit card object
 * @returns {Void}
 */
nlobjWebStoreCustomer.prototype.updateCreditCard = function(creditCard) { };

/**
 * Updates profile of the current customer.
 * @param {Object} customer [required] Object with values for fields:
 * <br> - internalId [required]
 * <br> - email [optional]
 * <br> - emailsubscribe [optional]
 * <br> - name [optional]
 * <br> - customfields [optional]
 */
nlobjWebStoreCustomer.prototype.updateProfile = function(customer) { };



/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getCartLinkHtml = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getCartUrl = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getCheckoutLinkHtml = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getCheckoutUrl = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getCompanyId = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getCrumbTrail = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getCurrencySelectHtml = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getCustomerCenterLinkHtml = function() {  };
;
/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getCustomerCenterUrl = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getGlobalSearchFormHtml = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getGlobalSearchHtml = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getJSessionId = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getLanguageSelectHtml = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getLoginLinkHtml = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getLoginUrl = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getLogoutLinkHtml = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getLogoutUrl = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getPageFullHead = function() {  };

/**
 * @returns {String}
 * @memberOf nlobjStandardTagLibrary
 */
nlobjStandardTagLibrary.prototype.getPageHead = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getPageLinks = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getPageTabs = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getPageTop = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getRegionSelectHtml = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getRegistrationLinkHtml = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getRegistrationUrl = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getReloginLinkHtml = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getReloginUrl = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getSideBarWidth = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getSiteLogoHtml = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getSiteNavigationHtml = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getUserInfo = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getUserInfo2 = function() {  };

/**
 * @returns {String}
 */
nlobjStandardTagLibrary.prototype.getWelcomeImageHtml = function() {  };



/**
 * Adds an item to cart/order
 * API Governance: 10
 * @param {Object} item Object with values for fields:
 * <br><li>internalId
 * <br><li>quantity
 * <br><li>options [optional]
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.addItem = function(item) {  };

/**
 * Adds items to cart/order
 * API Governance: 20
 * @param {Object[]} items Each item contains:
 * <br><li>internalId
 * <br><li>quantity
 * <br><li>options [optional]
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.addItems = function(items) {  };

/**
 * Applies a specified gift certificate to the order
 * API Governance: 5
 * @param {String} giftCertificate Gift certificate
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.applyGiftCertificate = function(giftCertificate) {  };

/**
 * Applies a specified promotion code to the order
 * API Governance: 5
 * @param {String} promoCode Promo code
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.applyPromotionCode = function(promoCode) {  };

/**
 * Estimates shipping cost
 * API Governance: 20
 * @param {Object} address Object with values for fields:
 * <br><li>zip
 * <br><li>country
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.estimateShippingCost = function(address) {  };

/**
 * Gets the specified applied gift certificate
 * @param {String} giftCertificate Gift certificate
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object}
 */
nlobjWebStoreOrder.prototype.getAppliedGiftCertificate = function(giftCertificate, fields) {  };

/**
 * Gets all applied gift certificates
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object[]}
 */
nlobjWebStoreOrder.prototype.getAppliedGiftCertificates = function(fields) {  };

/**
 * Gets the specified applied promotion code
 * @param {String} promocode Promo code
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object}
 */
nlobjWebStoreOrder.prototype.getAppliedPromotionCode = function(promocode, fields) {  };

/**
 * Gets all applied promotion codes
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object[]}
 */
nlobjWebStoreOrder.prototype.getAppliedPromotionCodes = function(fields) {  };

/**
 * Gets the specified available shipping method
 * API Governance: 10
 * @param {String} shipMethod Shipping method
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object}
 */
nlobjWebStoreOrder.prototype.getAvailableShippingMethod = function(shipMethod, fields) {  };

/**
 * Gets all available shipping methods
 * API Governance: 20
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object[]}
 */
nlobjWebStoreOrder.prototype.getAvailableShippingMethods = function(fields) {  };

/**
 * Gets custom fields for the order record
 * @returns {Object[]}
 */
nlobjWebStoreOrder.prototype.getCustomFields = function() {  };

/**
 * Gets custom field values for the current order
 * @returns {Object[]}
 */
nlobjWebStoreOrder.prototype.getCustomFieldValues = function() {  };

/**
 * Gets standard field values for the current order
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object[]}
 */
nlobjWebStoreOrder.prototype.getFieldValues = function(fields) {  };

/**
 * Gets a specified cart/order item
 * @param {String} orderItemId Order item id
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object}
 */
nlobjWebStoreOrder.prototype.getItem = function(orderItemId, fields) {  };

/**
 * Gets an item option for a specified cart/order item
 * @param {String} orderItemId Order item id
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object}
 */
nlobjWebStoreOrder.prototype.getItemOption = function(orderItemId, fields) {  };

/**
 * Gets cart/order items
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object[]}
 */
nlobjWebStoreOrder.prototype.getItems = function(fields) {  };

/**
 * Gets the shipping field values for an order item (Available when Multiple Shipping Routes feature is enabled)
 * @param {String} itemId Item id
 * @returns {Object[]}
 */
nlobjWebStoreOrder.prototype.getItemShippingFieldValues = function(itemId) {  };

/**
 * Gets cart/order summary
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object}
 */
nlobjWebStoreOrder.prototype.getOrderSummary = function(fields) {  };

/**
 * Gets the order’s payment details
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object}
 */
nlobjWebStoreOrder.prototype.getPayment = function(fields) {  };

/**
 * Gets the shipping method for order
 * @param {Object} fields [optional] Fields object or array
 * @returns {Object}
 */
nlobjWebStoreOrder.prototype.getShippingMethod = function(fields) {  };

/**
 * Clears all applied gift certificates
 * API Governance: 5
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.removeAllGiftCertificates = function() {  };

/**
 * Empties cart (removes all item)
 * API Governance: 10
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.removeAllItems = function() {  };

/**
 * Removes an item from cart/order
 * API Governance: 10
 * @param {String} orderItemId Order item id
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.removeItem = function(orderItemId) {  };

/**
 * Removes the shipping address for an order item (Available when Multiple Shipping Routes feature is enabled)
 * @param {String} itemId Item id
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.removeItemShippingAddress = function(itemId) {  };

/**
 * Removes the shipping method for an order item (Available when Multiple Shipping Routes feature is enabled)
 * @param {String} itemId Item id
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.removeItemShippingMethod = function(itemId) {  };

/**
 * Removes the specified promotion code from the order
 * API Governance: 5
 * @param {String} promoCode Promo code
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.removePromotionCode = function(promoCode) {  };

/**
 * Sets the billing address for the order
 * @param {String} addressId Address id
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.setBillingAddress = function(addressId) {  };

/**
 * Sets custom field values for the order record
 * @param {Object} customFields Object with name/value pair for each field
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.setCustomFieldValues = function(customFields) {  };

/**
 * Sets the shipping address for an order item (Available when Multiple Shipping Routes feature is enabled)
 * @param {String} itemId Item id
 * @param {String} shipAddressId Shipping address id
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.setItemShippingAddress = function(itemId, shipAddressId) {  };

/**
 * Sets the shipping fields for an order item. (Available when Multiple Shipping Routes feature is enabled)
 * @param {Object} item Object with values for fields:
 * <br><li>itemId
 * <br><li>shipMethodId [optional]
 * <br><li>shipAddressId [optional]
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.setItemShippingFields = function(item) {  };

/**
 * Sets the shipping method for an order item (Available when Multiple Shipping Routes feature is enabled)
 * @param {String} itemId Item id
 * @param {String} shipMethodId Shipping method id
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.setItemShippingMethod = function(itemId, shipMethodId) {  };

/**
 * Sets the payment for the order; for creditcard, creates a new record if internalid not provided
 * @param {Object} payment Object with values for fields:
 * <br><li>internalid [optional]
 * <br><li>ccname
 * <br><li>ccnumber
 * <br><li>creditcard
 * <br><li>expmonth
 * <br><li>expyear
 * <br><li>paymentmethod
 * <br><li>paymentterms [optional]
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.setPayment = function(payment) {  };

/**
 * Sets the shipping address for the order
 * API Governance: 10
 * @param {String} addressId Address id
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.setShippingAddress = function(addressId) {  };

/**
 * Sets the shipping method for the order
 * API Governance: 5
 * @param {Object} shipMethod Object with values for fields:
 * <br><li>shipmethod
 * <br><li>shipcarrier
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.setShippingMethod = function(shipMethod) {  };

/**
 * If required by site, sets whether user has read and agreed to terms and conditions
 * @param {String} bChecked Value must be "T" or "F"
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.setTermsAndConditions = function(bChecked) {  };

/**
 * Places the shopping order
 * API Governance: 20
 * @returns {Object} Object with the following fields:
 * <br><li>confirmationnumber
 * <br><li>internalId (key of the submitted sales order)
 * <br><li>messages
 * <br><li>statuscode
 */
nlobjWebStoreOrder.prototype.submit = function() {  };

/**
 * Updates a cart/order item’s quantity
 * API Governance: 10
 * @param {Object} item Object with values for fields:
 * <br><li>orderitemid
 * <br><li>quantity
 * <br><li>options[optional]
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.updateItemQuantity = function(item) {  };

/**
 * Updates cart/order items’ quantities
 * API Governance: 20
 * @param {Object[]} item Each item has fields:
 * <br><li>orderitemid
 * <br><li>quantity
 * <br><li>options[optional]
 * @returns {Void}
 */
nlobjWebStoreOrder.prototype.updateItemQuantities = function(items) {  };



/**
 * Page generator
 * @returns {nlobjPageGenerator} Page generator
 */
function nlobjPageGenerator() { }

/**
 * Adds a bread crumb to the end of the existing bread crumb trail
 * @param {String} label Text displayed for the bread crumb
 * @param {String} url URL to which the bread crumb links
 * @returns {Void}
 */
nlobjPageGenerator.prototype.addBreadCrumb = function(label, url) {  };

/**
 * Adds the specified HTML to the top of the page’s &lt;head&gt; section, before the stylesheet HTML
 * @param {String} html HTML content
 * @returns {Void}
 */
nlobjPageGenerator.prototype.addHeadHtml = function(html) {  };

/**
 * Adds the specified HTML to the top of the page’s &lt;head&gt; section, after the stylesheet HTML
 * @param {String} html HTML content
 * @returns {Void}
 */
nlobjPageGenerator.prototype.addStylesheetHtml = function(html) {  };

/**
 * Adds a tab to the right of current tabs on the page
 * @param {String} id Unique string id for the tab
 * @param {String} label Label displayed within the tab
 * @param {String} url URL to which the tab links
 * @returns {Void}
 */
nlobjPageGenerator.prototype.addTab = function(id, label, url) {  };

/**
 * Adds lines of JavaScript to the page’s initialization script
 * @param {String} scriptLines JavaScript code as string
 * @returns {Void}
 */
nlobjPageGenerator.prototype.addToPageInitScript = function(scriptLines) {  };

/**
 * Removes all bread crumbs from the page
 * @returns {Void}
 */
nlobjPageGenerator.prototype.removeBreadCrumbs = function() {  };

/**
 * Removes a specified tab from the page
 * @param {String} id Tab id
 * @returns {Void}
 */
nlobjPageGenerator.prototype.removeTab = function(id) {  };

/**
 * Removes all tabs from the page
 * @returns {Void}
 */
nlobjPageGenerator.prototype.removeTabs = function() {  };

/**
 * Establishes HTML for the page &lt;doctype&gt; tag
 * @param {String} html HTML content
 * @returns {Void}
 */
nlobjPageGenerator.prototype.setDocTypeHtml = function(html) {  };

/**
 * Establishes HTML for the page’s &lt;meta&gt; tags
 * @param {String} html HTML content
 * @returns {Void}
 */
nlobjPageGenerator.prototype.setMetaTagHtml = function(html) {  };

/**
 * Establishes a title for the page
 * @param {String} title Title text
 * @returns {Void}
 */
nlobjPageGenerator.prototype.setPageTitle = function(title) {  };

/**
 * Causes the specified tab to be displayed as the currently active tab
 * @param {String} id Tab id
 * @returns {Void}
 */
nlobjPageGenerator.prototype.setSelectedTab = function(id) {  };

/**
 * Indicates whether tab navigation should be shown or hidden
 * @param {Boolean} show True to display nagivation, false to hide it
 * @returns {Void}
 */
nlobjPageGenerator.prototype.showTabNavigation = function(show) {  };
