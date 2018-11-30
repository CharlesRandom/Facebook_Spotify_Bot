/*
 * Copyright 2016-present, Bquate.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* jshint node: true, devel: true */

var VALIDATION_TOKEN = 'BquateBotValidationToken';
var APP_SECRET = '526d8543df72dd2b3427a343197965fa';
// Bquate
var PAGE_ACCESS_TOKEN = 'EAAZAZAFBJNlaoBAFBqMF2vlmgpRGdSpMTJvYTeOlZCnoTVtm4NVRbDoyGNvosJvigEhLG7xZBKM3Mkf6RRBSlhzLo0VHMggQyuhaaipvhrP6njFaZCJ9MjW4LESR1jbpSyInszrZB3uy4mZCF9ZCKx4KBgYTewMSieVTi7RTMAxFfAZDZD';
var FB_APP_ID = '1786792601556394';
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var querystring = require('querystring');

/*
 * Spotify Web API
 * Instantiate the wrapper
 */
var client_id = 'XXX'; // Your client id
var client_secret = 'XXX'; // Your secret
var ngrok_url = 'https://2325329f.ngrok.io' // Use ngrok to make a tunnel to localhost, it changes everytime
var redirect_uri = ngrok_url + '/callback'; // Your redirect uri
var searchBool = false;
var talkPerson = false;
var searchParams = [];
var artistIDs = [];
var artistNames = [];
var relatedArtists = [];
var urisList = [];
var auxSpotifyUser;
var auxSpotifyPlaylist;
var countNoTracksArtist = 0;

// To close the browser when using a web-url button
var IMAGE_URL = 'http://www.disorder.cl/blog/wp-content/uploads/2014/11/bquatechico.jpg';
var DISPLAY_TEXT = 'Hemos terminado, ahora regresemos'
var CLOSE_BROWSER_URL = 'https://www.messenger.com/closeWindow/?image_url=' + IMAGE_URL + '&display_text=' + DISPLAY_TEXT;

// Answers for the FAQs
const BQUATE_ANSWER = 'Somos una plataforma de distribución digital de música, especializada en colocar tu música en las principales tiendas online. Además, somos Premium Partners de YouTube. Significa que puedes vincular tu canal de Youtube a nuestra network y empezar a monetizarlo';
const ISRC_ANSWER_1 = 'El ISRC es un código único asignado a cada fonograma, el cual facilita el intercambio preciso de información sobre la titularidad, el uso de grabaciones y simplifica la administración de los derechos involucrados en los mismos';
const ISRC_ANSWER_2 = 'Es algo así como la huella digital de cada grabación, lo que lo convierte en la llave para la recolección de regalías en la era digital';
const UPC_ANSWER = 'El nombre más común que recibe el código UPC es “código de barras”. Son códigos únicos que se asignan a las producciones para que, entre otras cosas, las tiendas digitales puedan identificar dicha producción en su stock y seguir las ventas digitales de cada Álbum, EP o Single que distribuyes';
const CONTENTID_ANSWER = 'El ContentID es una herramienta de Youtube que protege tu contenido de uso de terceros. Si alguien llega a poner contenido de tu autoría en sus vídeos, puedes monetizarlo o reclamarlo :)';
const DISMUS_ANSWER = 'Distribuir tu música es muy sencillo.\nPrimero debes crear una cuenta en Bquate con tu correo electrónico.\nUna vez creada, ingresas a la opción <Proyecto Nuevo> que verás en la parte superior izquierda, luego selecciona el paquete que más te convenga y puedes continuar a los 5 pasos de la distribución :) ';
const NECDIS_ANSWER = 'La portada debe estar en formato JPG o PNG y 1400x1400 dimensiones\nRecuerda tener tus audio en formato WAV o FLAC';
const RECOGNITION_ANSWER_1 = 'Es el paquete de reconocimiento que incluye MusicID, este servicio permite registrar álbumes, EPs o singles en la base de datos mundial de discos';
const RECOGNITION_ANSWER_2 = 'De esta manera, las producciones serán identificadas en dispositivos mp3, computadores, Smart TVs, USB. Además incluye Shazam, la aplicación que los usuarios usan para identificar una canción o artista';
const INGRESOS_ANSWER_1 = 'Para verificar los ingresos generados por tus producciones distribuidas, debes ingresar a tu cuenta en Bquate, ir al menú en la parte izquierda, escoger la opción ESTADÍSTICAS>Ingresos por música';
const INGRESOS_ANSWER_2 = 'El primer reporte de ventas de las tiendas aparece en tu cuenta 2 meses y 15 días después de haberse publicado la producción. Los siguientes serán cada 25 o 26 del mes';
const PAGO_ANSWER = 'Contamos con varios métodos de pago. Puedes hacer tu compra con tarjeta de crédito, Paypal e incluso efectivo si estás en Perú, México, Colombia o Argentina';
const TIENDA_ANSWER = 'Nuestro sistema verifica el pago en un período de hasta 48 horas.\nUna vez confirmado, hacemos la distribución y las tiendas toman un tiempo de 1 a 12 o 15 días en tener la música disponible';



app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.send('¡Hola! 🙌 Soy BquateBot 🤖');
});

app.listen(5000, function () {
  console.log('Listening on port 5000');
});

/*
 * Respond to Facebook's verification
 * Use your own validation token. Check that the token used in the Webhook 
 * setup is the same token used here.
 *
 */
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've 
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL. 
 * 
 */
app.get('/authorize', function(req, res) {
  var accountLinkingToken = req.query['account_linking_token'];
  var redirectURI = req.query['redirect_uri'];

  // Authorization Code should be generated per user by the developer. This will 
  // be passed to the Account Linking callback.
  var authCode = "1234567890";

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  });
});

/*
 * Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an 
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to 
 * Messenger" plugin, it is the 'data-ref' field. Read more at 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the 
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger' 
  // plugin.
  var passThroughParam = event.optin.ref;

  console.log("Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d", senderID, recipientID, passThroughParam, 
    timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, "Authentication successful", "RECEIVED_AUTHENTICATION_METADATA");
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message' 
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some 
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've 
 * created. If we receive a message with an attachment (image, video, audio), 
 * then we'll simply confirm that we've received the attachment.
 * 
 */
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;  

  if (isEcho) {
    // Just logging message echoes to console
    console.log("Received echo for message %s and app %d with metadata %s", 
      messageId, appId, metadata);
    
    // Because Facebook Send API is ASYNC, messages may not be delivered in order
    // use MESSAGE_ECHO METADATA to check which message was delivered and dispatch the next one
    switch (metadata) {
      case 'GREETING_METADATA':
        // sendMenuMessage(recipientID);
        sendBasicOptions(recipientID);
      break;

      case 'FAQS_METADATA':
        sendFAQsMessage(recipientID);
      break;
      
      case 'BQUATE_METADATA':
        sendQuickReply(recipientID);
      break;

      case 'ISCR_METADATA_1':
        sendTextMessage(recipientID, ISRC_ANSWER_2, "ISCR_METADATA_2");
      break;

      case 'ISCR_METADATA_2':
        sendQuickReply(recipientID);
      break;

      case 'RECOGNITION_METADATA_1':
        sendTextMessage(recipientID, RECOGNITION_ANSWER_2, "RECOGNITION_METADATA_2");
      break;

      case 'RECOGNITION_METADATA_2':
        sendQuickReply(recipientID);
      break;

      case 'INGRESOS_METADATA_1':
        sendTextMessage(recipientID, INGRESOS_ANSWER_2, "INGRESOS_METADATA_2");
      break;

      case 'INGRESOS_METADATA_2':
        sendQuickReply(recipientID);
      break;
      
      case 'PAGO_METADATA':
        sendQuickReply(recipientID);
      break;
      
      case 'TIENDA_METADATA':
        sendQuickReply(recipientID);
      break;
      
      case 'UPC_METADATA':
        sendQuickReply(recipientID);
      break;
      
      case 'CONTENTID_METADATA':
        sendQuickReply(recipientID);
      break;
      
      case 'DISMUS_METADATA':
        sendQuickReply(recipientID);
      break;
      
      case 'NECDIS_METADATA':
        sendQuickReply(recipientID);
      break;

      case 'MEZCLANDO_METADATA':
        // sendGifMessage(recipientID);
        getSpotifyUserAuthorization(recipientID);
      break;
      
      case 'PLAYLIST_QUERY_METADATA':
        // getSearchParams(recipientID);
        searchBool = true;
      break;

      case 'YESNO_METADATA':
        sendYesNoButton(recipientID);
      break;

      case 'NO_ARTIST_METADATA':
        sendBasicOptions(recipientID);
      break;

      case 'PERSON_METADATA':
        // DO NOTHING until someone come and start chating with the user
        talkPerson = true;
      break;
    }
    return;
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
    console.log("Quick reply for message %s with payload %s",
      messageId, quickReplyPayload);

    // sendTextMessage(senderID, "Quick reply tapped");
    handleQuickReply(quickReplyPayload, senderID);
    return;
  }

  if (messageText) {

    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.

    if(messageText.search(/hola/i) >= 0) {
      console.log("if hola");
      messageText = 'hola';
    } else if(messageText.search(/ayuda/i) >= 0) {
      console.log("if ayuda");
      messageText = 'ayuda';
    } else if(messageText.search(/gracias/i) >= 0) {
      console.log("if gracias");
      messageText = 'gracias';
    } else if(messageText.search(/bye/i) >= 0) {
      console.log("if bye");
      messageText = 'bye';
    } else if(messageText.search(/bquatebot/i) >= 0) {
      console.log("if BquateBot");
      messageText = 'BquateBot';
    }

    switch (messageText) {
      case 'Hola':
        if(!talkPerson) {
          getUserInfo(senderID);
        }
        break;

      case 'hola':
        if(!talkPerson) {
          console.log("keyword : hola");
          getUserInfo(senderID);
        }
        break;

      case 'BquateBot':
        console.log("keyword : BquateBot");
        talkPerson = false;
        getUserInfo(senderID);
        break;

      case 'Bquatebot':
        talkPerson = false;
        getUserInfo(senderID);
        break;

      case 'bquatebot':
        talkPerson = false;
        getUserInfo(senderID);
        break;

      case 'Adiós':
        if(!talkPerson) {
          sendTextMessage(senderID, "Hasta luego! 🙌", "FINISH_METADATA");
        }
        break;

      case 'adiós':
        if(!talkPerson) {
          sendTextMessage(senderID, "Hasta luego! 🙌", "FINISH_METADATA");
        }
        break;

      case 'Adios':
        if(!talkPerson) {
          sendTextMessage(senderID, "Hasta luego! 🙌", "FINISH_METADATA");
        }
        break;

      case 'adios':
        if(!talkPerson) {
          sendTextMessage(senderID, "Hasta luego! 🙌", "FINISH_METADATA");
        }
        break;

      case 'Bye':
        if(!talkPerson) {
          sendTextMessage(senderID, "Hasta luego! 🙌", "FINISH_METADATA");
        }
        break;

      case 'bye':
        if(!talkPerson) {
          sendTextMessage(senderID, "Hasta luego! 🙌", "FINISH_METADATA");
        }
        break;

      case 'Ciao':
        if(!talkPerson) {
          sendTextMessage(senderID, "Hasta luego! 🙌", "FINISH_METADATA");
        }
        break;

      case 'ciao':
        if(!talkPerson) {
          sendTextMessage(senderID, "Hasta luego! 🙌", "FINISH_METADATA");
        }
        break;

      case 'Gracias':
        if(!talkPerson) {
          sendTextMessage(senderID, "De nada, hasta luego! 🙌", "FINISH_METADATA");
        }
        break;

      case 'gracias':
        if(!talkPerson) {
          sendTextMessage(senderID, "De nada, hasta luego! 🙌", "FINISH_METADATA");
        }
        break;

      case 'Muchas gracias':
        if(!talkPerson) {
          sendTextMessage(senderID, "De nada, hasta luego! 🙌", "FINISH_METADATA");
        }
        break;

      case 'muchas gracias':
        if(!talkPerson) {
          sendTextMessage(senderID, "De nada, hasta luego! 🙌", "FINISH_METADATA");
        }
        break;

      case 'Ayuda':
        if(!talkPerson) {
          talkPerson = true;
          sendTextMessage(senderID, "En un momento alguien te atenderá, " +
          "si quieres hablar conmigo de nuevo escribe BquateBot 🙌", "PERSON_METADATA");
        }
        break;

      case 'ayuda':
        if(!talkPerson) {
          console.log("keyword : ayuda");
          talkPerson = true;
          sendTextMessage(senderID, "En un momento alguien te atenderá, " +
          "si quieres hablar conmigo de nuevo escribe BquateBot 🙌", "PERSON_METADATA");
        }
        break;

      default:
        if(!searchBool & !talkPerson) {
          sendTextMessage(senderID, "Debes seleccionar una opción del menú. ☝️😁 Si quieres hablar con un asesor escribe Ayuda","DEFAULT_METADATA");
        } else {
          if(searchBool) {
            getSearchParams(senderID, messageText);  
          }
        }
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received", "ATTACHMENTS_METADATA");
  }
}


/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s", 
        messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}

/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message. 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 * 
 */
function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  // sendTextMessage(senderID, "Postback called");

  // Dispatch new message depending on tapped option (payload)
  switch (payload) {
    case 'MENU_PAYLOAD':
        sendMenuMessage(senderID);
        break;

    case 'FAQS_PAYLOAD':
        sendTextMessage(senderID, "Estas son las dudas más comunes, desliza para encontrar la que te interesa", "FAQS_METADATA");
        break;

    case 'BQUATE_PAYLOAD':
        sendTextMessage(senderID, BQUATE_ANSWER, "BQUATE_METADATA");
        break;

    case 'ISRC_PAYLOAD':
        sendTextMessage(senderID, ISRC_ANSWER_1, "ISCR_METADATA_1");
        break;

    case 'RECOGNITION_PAYLOAD':
        sendTextMessage(senderID, RECOGNITION_ANSWER_1, "RECOGNITION_METADATA_1");
        break;

    case 'INGRESOS_PAYLOAD':
        sendTextMessage(senderID, INGRESOS_ANSWER_1, "INGRESOS_METADATA_1");
        break;

    case 'PAGO_PAYLOAD':
        sendTextMessage(senderID, PAGO_ANSWER, "PAGO_METADATA");
        break;

    case 'TIENDA_PAYLOAD':
        sendTextMessage(senderID, TIENDA_ANSWER, "TIENDA_METADATA");
        break;

    case 'TUTORIAL_PAYLOAD':
        sendTutorialMessage(senderID);
        break;

    case 'UPC_PAYLOAD':
        sendTextMessage(senderID, UPC_ANSWER, "UPC_METADATA");
        break;

    case 'CONTENTID_PAYLOAD':
        sendTextMessage(senderID, CONTENTID_ANSWER, "CONTENTID_METADATA");
        break;

    case 'DISMUS_PAYLOAD':
        sendTextMessage(senderID, DISMUS_ANSWER, "DISMUS_METADATA");
        break;

    case 'NECDIS_PAYLOAD':
        sendTextMessage(senderID, NECDIS_ANSWER, "NECDIS_METADATA");
        break;

    case 'YES_SPOTIFY_PAYLOAD':
        sendTextMessage(senderID, "Ok, dime el artista o banda", "PLAYLIST_QUERY_METADATA");
        break;

    case 'NO_SPOTIFY_PAYLOAD':
        searchBool = false;
        // sendGifMessage(senderID);
        getArtistId();
        sendTextMessage(senderID, "Ok, buscando... tomará solo un momento ✋", "MEZCLANDO_METADATA");
        break;

    case 'LATER_SPOTIFY_PAYLOAD':
        sendShareButton(senderID,auxSpotifyUser,auxSpotifyPlaylist);
        break;

    case 'SPOTIFY_PLAYLIST_PAYLOAD':
        talkPerson = false;
        sendTextMessage(senderID, "Dime un artista o banda como quieres que suene la lista", "PLAYLIST_QUERY_METADATA");
        break;
        
    case 'SPOTIFY_CANCEL_PAYLOAD':
        cleanVariables();
        sendBasicOptions(senderID);
        break;

    case 'LATER_PAYLOAD':
        cleanVariables();
        sendBasicOptions(senderID);
        break;

    case 'PERSON_PAYLOAD':
        talkPerson = true;
        sendTextMessage(senderID, "En un momento alguien te atenderá, " +
        "si quieres hablar conmigo de nuevo escribe BquateBot 🙌", "PERSON_METADATA");
        break;

    default:
      sendTextMessage(senderID, payload, "DEFAULT_METADATA");
  }
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 * 
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 * 
 */
function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}

/*
 * Send a Greeting message using the Send API.
 *
 */
function sendGreetingMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "¡Hola " + messageText + "! 🙌 Soy BquateBot 🤖 y trataré de ayudarte",
      metadata: "GREETING_METADATA"
    }
  };

  callSendAPI(messageData);
}

/*
 * Send 2 basic options. 
 * 1: See MENU. 2: Create playlist
 */
function sendBasicOptions(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "🙂 ¿Qué deseas?",
          buttons:[{
            type: "postback",
            title: "Ver Menú",
            payload: "MENU_PAYLOAD"
          }, {
            type: "postback",
            title: "Crear playlist",
            payload: "SPOTIFY_PLAYLIST_PAYLOAD"
          }, {
            type: "postback",
            title: "Hablar con asesor",
            payload: "PERSON_PAYLOAD"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Send a Menu with the basic options.
 *
 */
function sendMenuMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "🙂 Estas son las opciones",
          buttons:[{
            type: "web_url",
            url: "https://www.bquate.com/",
            title: "Ir a Bquate"
          }, {
            type: "postback",
            title: "FAQs",
            payload: "FAQS_PAYLOAD"
          }, {
            type: "phone_number",
            title: "Llámanos",
            payload: "+525575860277"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 */
function sendFAQsMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Preguntas frecuentes",
            subtitle: "Quiénes somos y qué ofrecemos",
            item_url: "https://www.bquate.com",               
            image_url: "http://www.disorder.cl/blog/wp-content/uploads/2014/11/bquatechico.jpg",
            buttons: [{
              type: "postback",
              title: "¿Qué es Bquate?",
              payload: "BQUATE_PAYLOAD"
            }, {
              type: "web_url",
              url: "https://www.youtube.com/watch?v=uWN3BCdcs6g",
              title: "Tutorial"
            }, {
              type: "web_url",
              url: "https://mi.bquate.com/iniciar-sesion",
              title: "Crear cuenta"
            }],
          }, {
            title: "Preguntas técnicas",
            subtitle: "Términos complicados explicados de manera simple",
            item_url: "https://www.bquate.com/soporte/preguntas-frecuentes",               
            image_url: "http://www.disorder.cl/blog/wp-content/uploads/2014/11/bquatechico.jpg",
            buttons: [{
              type: "postback",
              title: "Código ISRC",
              payload: "ISRC_PAYLOAD"
            }, {
              type: "postback",
              title: "Código UPC",
              payload: "UPC_PAYLOAD"
            }, {
              type: "postback",
              title: "ContentID",
              payload: "CONTENTID_PAYLOAD"
            }],
          }, {
            title: "Sobre el servicio",
            subtitle: "Lo básico sobre la distribución digital",
            item_url: "https://www.bquate.com/soporte/preguntas-frecuentes",               
            image_url: "http://www.disorder.cl/blog/wp-content/uploads/2014/11/bquatechico.jpg",
            buttons: [{
              type: "postback",
              title: "Distribuir mi música",
              payload: "DISMUS_PAYLOAD"
            }, {
              type: "postback",
              title: "Requisitos para distribuir",
              payload: "NECDIS_PAYLOAD"
            }, {
              type: "postback",
              title: "Recognition Pack",
              payload: "RECOGNITION_PAYLOAD"
            }]
          }, {
            title: "Sobre el dinero",
            subtitle: "Lo básico sobre los ingresos y métodos de pago",
            item_url: "https://www.bquate.com/soporte/preguntas-frecuentes",               
            image_url: "http://www.disorder.cl/blog/wp-content/uploads/2014/11/bquatechico.jpg",
            buttons: [{
              type: "postback",
              title: "Ver ingresos",
              payload: "INGRESOS_PAYLOAD"
            }, {
              type: "postback",
              title: "Métodos de pago",
              payload: "PAGO_PAYLOAD"
            }, {
              type: "postback",
              title: "Disponible en tiendas",
              payload: "TIENDA_PAYLOAD"
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendTutorialMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: "https://www.youtube.com/watch?v=uWN3BCdcs6g"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a text message using metadata to check by echo if it was delivered.
 *
 */
function sendTextMessage(recipientId, messageText, messageMetadata) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: messageMetadata
    }
  };

  callSendAPI(messageData);
}

/*
 * Dispatch new message/menu depending on tapped option.
 *
 */
function handleQuickReply(quickReplyPayload, senderID) {
  switch (quickReplyPayload) {
    case 'START_PAYLOAD':
        sendBasicOptions(senderID);
        break;

    case 'FAQS_PAYLOAD':
        sendFAQsMessage(senderID);
        break;

    case 'PERSON_PAYLOAD':
        sendTextMessage(senderID, "En un momento alguien te atenderá, " +
          "si quieres hablar conmigo de nuevo escribe BquateBot 🙌", "PERSON_METADATA");
        break;

    case 'FINISH_PAYLOAD':
        sendTextMessage(senderID, "Hasta luego! 🙌", "FINISH_METADATA");
        break;

    default:
      sendTextMessage(senderID, "qucik reply not handled", "DEFAULT_METADATA");
  }
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "¿Qué deseas hacer ahora?",
      metadata: "QUICKREPLY_METADATA",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Inicio",
          "payload":"START_PAYLOAD"
        },
        {
          "content_type":"text",
          "title":"Otra FAQ",
          "payload":"FAQS_PAYLOAD"
        },
        {
          "content_type":"text",
          "title":"Hablar con alguien",
          "payload":"PERSON_PAYLOAD"
        },
        {
          "content_type":"text",
          "title":"Terminé",
          "payload":"FINISH_PAYLOAD"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: "http://i.giphy.com/Z4ITmGFsXV19C.gif"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s", 
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s", 
        recipientId);
      }
    } else {
      console.error(response.error);
    }
  });  
}

/*
 * Call the User-Profile API. The message data goes in the body. If successful, we'll 
 * get the user info in a response 
 *
 */
function getUserInfo(userID) {
  request({
    uri: 'https://graph.facebook.com/v2.6/' + userID + '?fields=first_name,last_name,profile_pic,locale,timezone,gender',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'GET',
    json: true

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var firstName = body.first_name;

      if (firstName) {
        console.log("Successfully got user profile info with id %s and username %s", 
          userID, firstName);
          sendGreetingMessage(userID, firstName);
      } else {
      console.log("Successfully called Send API for recipient %s", 
        userID);
      }
    } else {
      console.error(response.error);
    }
  });
}

/*
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * * * * * * * * * * * SPOTIFY RELATED * * * * * * * * * * *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */

/*
 * Ask if user wants to add another artist/band to playlist.
 * Then send button message to get confirmation
 */
function sendYesNoMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Nice! 👌",
      metadata: "YESNO_METADATA"
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a YES/NO button message to know if user wants to add more artists/bands to playlist.
 * YES: Asks for artist/band. NO: Start request
 */
function sendYesNoButton(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "¿Hay otro que quieras agregar?",
          buttons:[{
            type: "postback",
            title: "Si",
            payload: "YES_SPOTIFY_PAYLOAD"
          }, {
            type: "postback",
            title: "No",
            payload: "NO_SPOTIFY_PAYLOAD"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Send a Listen Now! button message to open the playlist just created.
 * Escuchar: Open Spotify. NO: Ask if user wants to share the playlist
 */
function sendListenNowButton(recipientId, spotifyUserID, playlistID) {
  console.log("Successfully called Spotify sendListenNowButton");
  
  var openPlaylistUrl = "http://open.spotify.com/user/" + spotifyUserID + "/playlist/" + playlistID;
  console.log(openPlaylistUrl);
  
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Listo! Ya puedes escuchar la lista BquateBot Playlist 🤘",
          buttons:[{
            type: "web_url",
            url: openPlaylistUrl,
            title: "Escuchar ahora"
          }, {
            type: "postback",
            title: "Luego",
            payload: "LATER_SPOTIFY_PAYLOAD"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a Listen Now! button message to open the playlist just created.
 * Escuchar: Open Spotify. NO: Ask if user wants to share the playlist
 */
function sendShareButton(recipientId, spotifyUserID, playlistID) {
  var shareFacebookUrl = "https://www.facebook.com/dialog/share?app_id=" + FB_APP_ID + 
                          "&display=popup&href=https://open.spotify.com/user/" + spotifyUserID +
                          "/playlist/" + playlistID + "&redirect_uri=" + CLOSE_BROWSER_URL;

  var shareTwitterUrl = "http://www.twitter.com/share?url=https://open.spotify.com/user/" + spotifyUserID +
                          "/playlist/" + playlistID + "&hashtags=BeFan&text=@BquateMusic";

  console.log(shareFacebookUrl);
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Suena bien! 👌 No quieres compartirla?",
          buttons:[{
            type: "web_url",
            url: shareFacebookUrl,
            title: "Facebook"
          }, {
            type: "web_url",
            url: shareTwitterUrl,
            title: "Twitter"
          }, {
            type: "postback",
            title: "Ño",
            payload: "LATER_PAYLOAD"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Clean related variables so you can request them again
 *
 */
function cleanVariables() {
  // Clean related variables so you can request them again
  searchParams.length = 0;
  artistIDs.length = 0;
  artistNames.length = 0;
  relatedArtists.length = 0;
  urisList.length = 0;
  console.log(searchParams);
  console.log(artistIDs);
  console.log(artistNames);
  console.log(relatedArtists);
  console.log(urisList);
}

/*
 * Add artist/band names to look for their Spotify IDs later
 *
 */
function getSearchParams(recipientId, artistBand) {
  // Set it true to indicate the app is expecting an artist/band name
  if(!searchBool) {
    searchBool = true;
  }
  
  // Add artist/band to array to search later
  searchParams.push(artistBand);
  console.log(searchParams);
  if (searchParams.length == 4) {
    console.log("Successfully called Spotify getSearchParams IF");
    searchBool = false;
    getArtistId();
    sendTextMessage(recipientId, "Ok, con esos es suficiente... tomará solo un momento ✋", "MEZCLANDO_METADATA");
  } else{
    sendYesNoMessage(recipientId);
  }
}

/*
 * Call the Spotify Web API. If successful, we'll 
 * get the ID of the ARTISTs  
 *
 */
function getArtistId() {
  searchParams.forEach(function(value){
    // console.log(value);
    var getArtistOptions = {
      url: 'https://api.spotify.com/v1/search',
      qs: { 
            q: value,
            type: 'artist'
        },
      json: true
    };
    
    request.get(getArtistOptions, function(error, response, body) {      
      if(error) {
        console.log(error);
      } else {
        // Check if found aritst
        if (body.artists.items.length > 0) {
          // Check for duplicates before adding
          if (artistIDs.indexOf(body.artists.items[0].id)==-1) {
            artistIDs.push(body.artists.items[0].id);
            artistNames.push(body.artists.items[0].name);
            console.log(artistNames);
            getRelatedArtists(123, body.artists.items[0].id);
          }
        }
      } 
    });  
  });
}

function dispatchArtists(userID, spotifyUserID, playlistID, accessToken) {
  console.log("Successfully called Spotify dispatchArtists");
  // Add the query artists at the beginning to get songs of those too
  artistIDs.forEach(function(value){
    relatedArtists.unshift(value);
  });
  // console.log(relatedArtists);
  
  // Look for the top tracks of each artist to build the playlist
  relatedArtists.forEach(function(value){
    getTracks(userID, spotifyUserID, value, playlistID, accessToken);
  });
}

/*
 * Call the Spotify Web API. If successful, we'll 
 * get the top ten tracks in a response 
 *
 */
function getTracks(userID, spotifyUserID, artistID, playlistID, accessToken) {
  // console.log("Successfully called Spotify getTracks");
  request({
    uri: 'https://api.spotify.com/v1/artists/' + artistID + '/top-tracks',
    qs: { country: 'MX' },
    method: 'GET',
    json: true

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      if(body.tracks.length > 0) {
        if(body.tracks.length > 2) {
          var topTrack = body.tracks[2].uri;
        } else {
          var topTrack = body.tracks[0].uri;
        }
        urisList.push(topTrack);
        if(urisList.length == (relatedArtists.length - countNoTracksArtist)) {
          var tracksList = "";

          // INSERT SWITCH HERE
          switch(artistIDs.length) {
            case 1:
              urisList.forEach(function(value){
                tracksList = tracksList + value + ",";
              });
              break;
            
            case 2:
              if(urisList.length > 35) {
                tracksList = urisList[0] + "," + urisList[1] + "," + urisList[2] + "," + urisList[3] + "," +
                          urisList[4] + "," + urisList[5] + "," + urisList[6] + "," + urisList[7] + "," + 
                          urisList[8] + "," + urisList[9] + "," + urisList[10] + "," + urisList[11] + "," + 
                          urisList[12] + "," + urisList[13] + "," + urisList[20] + "," + urisList[21] + "," + 
                          urisList[22] + "," + urisList[23] + "," + urisList[24] + "," + urisList[25] + "," + 
                          urisList[26] + "," + urisList[27] + "," + urisList[28] + "," + urisList[29] + "," + 
                          urisList[30] + "," + urisList[31] + "," + urisList[32] + "," + urisList[33] + "," + 
                          urisList[34] + "," + urisList[35] + ",";
              } else {
                  urisList.forEach(function(value){
                  tracksList = tracksList + value + ",";
                });
              }
              break;

            case 3:
              if(urisList.length > 41) {
                tracksList = urisList[0] + "," + urisList[1] + "," + urisList[2] + "," + urisList[3] + "," +
                          urisList[4] + "," + urisList[5] + "," + urisList[6] + "," + urisList[7] + "," + 
                          urisList[8] + "," + urisList[20] + "," + urisList[21] + "," + urisList[22] + "," + 
                          urisList[23] + "," + urisList[24] + "," + urisList[25] + "," + urisList[26] + "," + 
                          urisList[27] + "," + urisList[28] + "," + urisList[30] + "," + urisList[31] + "," + 
                          urisList[32] + "," + urisList[33] + "," + urisList[34] + "," + urisList[35] + "," + 
                          urisList[36] + "," + urisList[37] + "," + urisList[38] + "," + urisList[39] + "," + 
                          urisList[40] + "," + urisList[41] + ",";
              } else {
                  urisList.forEach(function(value){
                  tracksList = tracksList + value + ",";
                });
              }
              break;

            case 4:
              if(urisList.length > 41) {
                tracksList = urisList[0] + "," + urisList[1] + "," + urisList[2] + "," + urisList[3] + "," +
                          urisList[4] + "," + urisList[5] + "," + urisList[10] + "," + urisList[11] + "," + 
                          urisList[12] + "," + urisList[13] + "," + urisList[14] + "," + urisList[15] + "," + 
                          urisList[20] + "," + urisList[21] + "," + urisList[22] + "," + urisList[23] + "," + 
                          urisList[24] + "," + urisList[25] + "," + urisList[30] + "," + urisList[31] + "," + 
                          urisList[32] + "," + urisList[33] + "," + urisList[34] + "," + urisList[35] + "," + 
                          urisList[36] + "," + urisList[37] + "," + urisList[38] + "," + urisList[39] + "," + 
                          urisList[40] + "," + urisList[41] + ",";
              } else {
                  urisList.forEach(function(value){
                  tracksList = tracksList + value + ",";
                });
              }
              break;

            case 5:
              if(urisList.length > 49) {
                tracksList = urisList[0] + "," + urisList[1] + "," + urisList[2] + "," + urisList[3] + "," +
                          urisList[4] + "," + urisList[10] + "," + urisList[11] + "," + urisList[12] + "," + 
                          urisList[13] + "," + urisList[14] + "," + urisList[20] + "," + urisList[21] + "," + 
                          urisList[22] + "," + urisList[23] + "," + urisList[24] + "," + urisList[30] + "," + 
                          urisList[31] + "," + urisList[32] + "," + urisList[33] + "," + urisList[34] + "," + 
                          urisList[40] + "," + urisList[41] + "," + urisList[42] + "," + urisList[43] + "," + 
                          urisList[44] + "," + urisList[45] + "," + urisList[46] + "," + urisList[47] + "," + 
                          urisList[48] + "," + urisList[49] + ",";
              } else {
                  urisList.forEach(function(value){
                  tracksList = tracksList + value + ",";
                });
              }
              break;
          }
          tracksList = tracksList.slice(0,tracksList.length-1);
          addTracks(userID, spotifyUserID, playlistID, accessToken, tracksList);
        } 
      } else {
          console.log(body);
          countNoTracksArtist = countNoTracksArtist + 1;
        }
    } else {
      console.error(response.error);
    }
  });
}

/*
 * Call the Spotify Web API. If successful, we'll 
 * get the top ten tracks in a response 
 *
 */
function getArtistTopTracks(userID, spotifyUserID, artistID, playlistID, accessToken) {
  request({
    // uri: 'https://api.spotify.com/v1/artists/' + artistID + '/top-tracks?country=MX',
    uri: 'https://api.spotify.com/v1/artists/' + artistID + '/top-tracks',
    qs: { country: 'MX' },
    method: 'GET',
    json: true

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var artistName = body.tracks[0].artists[0].name;
      var tracksList = "";

      if (artistName) {
        console.log(body);
        console.log("Successfully got artist top tracks with id %s and username %s", 
          artistID, artistName);
        body.tracks.forEach(function(value){
          console.log(value.name);
          artistName = artistName + "\n" + value.name;
          tracksList = tracksList + value.uri + ",";
        });
        tracksList = tracksList.slice(0,tracksList.length-1);
        console.log(tracksList);
        // sendTextMessage(userID, artistName, "SPOTIFY_METADATA");
        addTracks(userID, spotifyUserID, playlistID,accessToken, tracksList);
      } else {
      console.log("Successfully called Spotify API for recipient %s", 
        userID);
      }
    } else {
      console.error(response.error);
    }
  });
}

/*
 * Call the Spotify Web API. If successful, we'll 
 * add the top ten tracks to the playlist 
 *
 */
function addTracks(userID, spotifyUserID, playlistID, accessToken, tracksList) {
  console.log("Successfully called Spotify addTracks");
  var addTracksOptions = {
      url: 'https://api.spotify.com/v1/users/' + spotifyUserID + '/playlists/' + playlistID + '/tracks',
      headers: {  
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      qs: { uris: tracksList},
      json: true
    };
  // console.log(addTracksOptions);

  request.post(addTracksOptions, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
          console.log(response.statusCode, body);
          sendListenNowButton(userID, spotifyUserID, playlistID);
          auxSpotifyUser = spotifyUserID;
          auxSpotifyPlaylist = playlistID;

          // Clean related variables so you can request them again
          cleanVariables();
      }
  });
}
/*
 * Call the Spotify Web API. If successful, we'll 
 * get the top ten tracks in a response 
 *
 */
function getRelatedArtists(userID, artistID) {
  request({
    uri: 'https://api.spotify.com/v1/artists/' + artistID + '/related-artists',
    method: 'GET',
    json: true

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var artistName = body.artists[0].name;

      if (artistName) {
        console.log("Successfully got artist related artists with id %s and username %s", 
          artistID, artistName);
        artistName = "";
        body.artists.forEach(function(value){
          console.log(value.name);
          relatedArtists.push(value.id);
          artistName = artistName + value.name + "\n";
        });
      } else {
      console.log("Successfully called Spotify API for getRelatedArtists %s", 
        userID);
      }
    } else {
      console.error(response.error);
    }
  });
}

/*
 * Shows 2 buttons, one to give access to Spotify account 
 * an the other to cancel. If successful, we get code to request tokens
 *
 */
function getSpotifyUserAuthorization(recipientId) {
  var scope = "playlist-modify-public";
  var state = recipientId; // Workaround to keep ID so we can still send messages through Send API
  var get_auth_url = "https://accounts.spotify.com/authorize/?client_id=" + client_id +
    "&response_type=code&redirect_uri=" + redirect_uri + "&scope=" + scope + "&state=" + state;
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Necesito acceso a tu cuenta de Spotify para crear la lista. " +
            "Da click en 'Ir a Spotify' para autorizar o en 'Cancelar' si no estás seguro",
          buttons:[{
            type: "web_url",
            url: get_auth_url,
            title: "Ir a Spotify"
          }, {
            type: "postback",
            title: "Cancelar",
            payload: "SPOTIFY_CANCEL_PAYLOAD"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter
  console.log("Successfully called Spotify API callback");

  var code = req.query.code || null;
  var state = req.query.state || null;
  var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;

        // console.log(body);

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        var spotify_userid;
        request.get(options, function(error, response, body) {
          // console.log(body);
          spotify_userid = body.id;
          // console.log(spotify_userid);
          handleCallback(state, access_token, spotify_userid);
        });

        // we can also pass the token to the browser to make requests from there
        // res.redirect('/#' +
        //   querystring.stringify({
        //     access_token: access_token,
        //     refresh_token: refresh_token
        //   }));
        // Redirect to close the browser when using web-url button
        res.redirect(CLOSE_BROWSER_URL);
        // console.log("Closing browser");
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
});

/*
 * Call the Spotify Web API. If successful, we'll 
 * get the id of the playlist created 
 *
 */
function handleCallback(recipientId, accessToken, spotifyUserID) {
  console.log("Successfully called Spotify handleCallback");
  // Check if found artist ID
  if (artistIDs.length > 0) {
    console.log(artistIDs);
    var playlistName = "BquateBot feat. ";
    if(artistNames.length > 1) {
      artistNames.forEach(function(value){
        // console.log(value);
        playlistName = playlistName + value + " + ";
      });
      playlistName = playlistName.slice(0,playlistName.length-3);
    } else {
      playlistName = playlistName + artistNames[0];
    }
    console.log(playlistName);

    var createOptions = {
        url: 'https://api.spotify.com/v1/users/' + spotifyUserID + '/playlists',
        headers: {  
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        form: JSON.stringify({
          'name': playlistName,
          'public': true
        }),
        json: true
      };
    // console.log(createOptions);

    request.post(createOptions, function(error, response, body){
      if(error) {
          console.log(error);
      } else {
          // console.log(response.statusCode, body);
          var playlistID = body.id;
          console.log(playlistID);
          // getArtistTopTracks(recipientId, spotifyUserID, FOALS_ARTISTID, playlistID, accessToken);
          dispatchArtists(recipientId, spotifyUserID, playlistID, accessToken);
      }
    });
  } else {
    // Artist not found. Clean related variables so you can request them again
    cleanVariables();
    sendTextMessage(recipientId, "Parece que algo salió mal, no se encontró ningún artista con ese nombre 😓", "NO_ARTIST_METADATA");
  }
}