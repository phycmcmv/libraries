var http = require("http");
var oauthManagerModule = require("withings/authorization/oauth");
var config = require("withings/config");
var mappings = require("withings/mappings")

/**
 * Simple client to invoke the Withings API.
 * The constructor can throw exceptions
 * @class WithingsClient
 * @constructor WithingsClient
 * @param {Object} dto {
 *	{String} userid: the Withings identifier of the end user
 * }
 */
function WithingsClient(dto) {
  
  if (!dto.userId) {
   
    throw {
      "errorCode": "Invalid_Parameter",
      "errorDetail": "WithingsClient - dto.userId cannot be null or empty."
    };
  }
    
  this.userId = dto.userId;
  this.oauthManager = new oauthManagerModule.OAuthManager();
}

/**
 * Use this method to invoke the remore Withing REST API.
 * This method can throw exceptions.
 * @method callApi
 * @param {String} resource: the path to a withings resource, e.g. "v2/measure"
 * @param {Object} params: the list of parameters that are expected by the Withings API
 * @return {Object} the Withings' API response
 */
WithingsClient.prototype.callApi = function(resource, params) {
  
  var oauthCredentials = this.oauthManager.loadOAuthCredentials(this.userId);
  params["userid"] = this.userId;
  params["oauth_consumer_key"] = config.client_id;
  params["oauth_token"] = oauthCredentials.oauthToken;
  var url = this.oauthManager.signRequest("https", config.measuresHost, resource, params, oauthCredentials.oauthSecret);console.log(url);
  params["oauth_nonce"] = "" + params["oauth_nonce"];
  var requestParams = {
    
    url: url,
    method: "GET"
  };
  
  var response = http.request(requestParams);
  console.log("Response " + JSON.stringify(response));
  return this._parseResponse(response)
};

WithingsClient.prototype._parseResponse = function(response) {
  
  if (response.metadata && response.metadata.status && response.metadata.status == "failure") {
 
    throw {
      errorCode: response.errorCode,
      errorDetail: response.errorDetail
    };
  }
  
  if (response.status < 200 || response.status > 299) {
    throw response;
  }
  
  var bodyJson = response.body ? JSON.parse(response.body) : {};
  if (bodyJson.status && bodyJson.status != 0) {
    
    throw {
      "errorCode": "Withings_Error_" + bodyJson.status,
      "errorDetail": bodyJson.error ? bodyJson.error : mappings.errorCodes[bodyJson.status]
    };
  }
 
  if (bodyJson.body) {
    return bodyJson.body;
  }else {
    return bodyJson;
  }
}   				   				   				   				