//META{"name":"ImageEmote"}*//
function ImageEmote() {
	this.loadDatabase();
}
ImageEmote.prototype.load = function() {};

ImageEmote.prototype.start = function() {
	this.attachHandler();
};

ImageEmote.prototype.onSwitch = function() {
	this.attachHandler();
};

ImageEmote.prototype.stop = function() {
	var el = $('.channel-textarea textarea');
	if (el.length == 0) return;

	// Remove handlers and injected script
	el.unbind("click focus", this.focusHandler);
	el[0].removeEventListener("keydown", this.handleKeypress);
};

ImageEmote.prototype.unload = function() {};

ImageEmote.prototype.getName = function() {
	return "Image Emote";
};

ImageEmote.prototype.getDescription = function() {
	return "Allows you to send preset images with a chat command";
};

ImageEmote.prototype.getVersion = function() {
	return "1.2";
};

ImageEmote.prototype.getAuthor = function() {
	return "EhsanKia";
};

ImageEmote.prototype.attachHandler = function() {
	var el = $('.channel-textarea textarea');
	if (el.length == 0) return;
	var self = this;
	// Handler to catch key events
	this.handleKeypress = function (e) {
		var code = e.keyCode || e.which;
		if (code !== 13) return;
		var text = $(this).val();
		if (!ImageEmote.emoteData.hasOwnProperty(text)) return;
		self.sendBase64File(text.slice(1), ImageEmote.emoteData[text]);
		$(this).val("");

		e.preventDefault();
		e.stopPropagation();
	};

	// bind handlers
	el[0].addEventListener("keydown", this.handleKeypress, false);
};

// Function to convert base64 data to blob
// http://stackoverflow.com/a/16245768
// For large files, should probably use sliced version
ImageEmote.prototype.b64toBlob = function(b64Data) {
	var pieces = b64Data.split(',');
	var contentType = pieces[0].substr(5).split(';')[0];
	var data = pieces[1];

	var byteCharacters = atob(data);
	var byteNumbers = new Array(byteCharacters.length);
	for (var i = 0; i < byteCharacters.length; i++) {
		byteNumbers[i] = byteCharacters.charCodeAt(i);
	}

	var byteArray = new Uint8Array(byteNumbers);
	var blob = new Blob([byteArray], {type: contentType});
	return blob;
};

ImageEmote.prototype.sendBase64File = function(imageName, imageData) {
	var ext = '.' + imageData.split(';')[0].split('/')[1];
	var imageBlob = this.b64toBlob(imageData);
	var channelID = window.location.pathname.split('/').pop();

	var fd = new FormData();
	fd.append('file', imageBlob, imageName + ext);

	$.ajax({
	  type: "POST",
	  url: "https://discordapp.com/api/channels/" + channelID + "/messages",
	  headers: {
		  "authorization": localStorage.token.slice(1, -1)
	  },
	  data: fd,
	  processData: false,
	  contentType: false
	});
};

ImageEmote.prototype.getSettingsPanel = function() {
	var self = this;
	var settings = $('<div class="form"></div>');
	settings.append('<h1 style="font-weight: bold">Image database:</h1>');

	var rowHtml = "";
	rowHtml += '<div class="control-group ImageEmote-inputgroup">';
	rowHtml += '	<input style="width: 40%;" type="text" name="name" placeholder="Name">';
	rowHtml += '	<input style="width: 40%;" type="text" name="data" placeholder="Data">';
	rowHtml += '</div><br>';

	for (var key in ImageEmote.emoteData) {
		if (!ImageEmote.emoteData.hasOwnProperty(key)) continue;
		var row = $(rowHtml);
		row.find('input[name="name"]').val(key.slice(1));
		row.find('input[name="data"]').val(ImageEmote.emoteData[key]);
		settings.append(row);
	}

	settings.append(rowHtml);

	var addButton = $('<button type="button" class="btn btn-primary">Add Row</div>')
		.click(function() {
			$(this).before(rowHtml);
		});

	var saveButton = $('<button type="button" class="btn btn-primary">Save</div>')
		.click(function() {
			ImageEmote.emoteData = {};
			settings.find('.ImageEmote-inputgroup').each(function(i, el) {
				var $e = $(el);
				var key = '/i ' + $e.find('input[name="name"]').val();
				var data = $e.find('input[name="data"]').val();
				if (key.trim() === "" || data.trim() === "") return;
				ImageEmote.emoteData[key] = data;
			});

			self.saveDatabase();

			var $b = $(this).text('Saved!');
			setTimeout(function() {$b.text('Save');}, 1000);
		});

	settings.append(addButton);
	settings.append(saveButton);
	return settings;
};

ImageEmote.prototype.saveDatabase = function() {
	window.localStorage.ImageEmoteDB = btoa(JSON.stringify(ImageEmote.emoteData));
};

ImageEmote.prototype.loadDatabase = function() {
	if (window.localStorage.hasOwnProperty("ImageEmoteDB")) {
		var data = window.localStorage.ImageEmoteDB;
		ImageEmote.emoteData = JSON.parse(atob(data));
	} else {
		ImageEmote.emoteData = {};
	}
};
