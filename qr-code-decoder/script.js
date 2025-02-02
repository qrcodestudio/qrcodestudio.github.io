$(document).ready(function () {
	const kClassHidden = 'visually-hidden';
	const kUIDropArea = $('#qr-drop-area');
	const kUIFileInput = $('#qr-file-input');
	const kUIScanButton = $('#qr-scan-button');
	const kUIStopScanButton = $('#qr-stop-scan-button');
	const kUIFileErrorToast = $('#qr-file-error-toast');
	const kUICameraContainer = $('#qr-camera-container');
	const kUICameraPreview = $('#qr-camera-preview')[0];
	const kUICameraErrorToast = $('#qr-camera-error-toast');
	const kUIDecodedDialog = $('#qr-decoded-dialog');
	const kUIDecodedText = $('#qr-decoded-text');
	const kUIDecodedType = $('#qr-decoded-type');
	const kUIDecodedCopyButton = $('#qr-decoded-copy-button');
	const kUIDecodedCopyToast = $('#qr-decoded-copy-toast');
	let gCameraStream;
	let gCameraScanning = false;

	kUIDropArea.on('dragover', function (e) {
		e.preventDefault();
		$(this).addClass('bg-dark').addClass('text-bg-dark');
	});
	kUIDropArea.on('dragleave', function (e) {
		e.preventDefault();
		$(this).removeClass('bg-dark').removeClass('text-bg-dark');
	});
	kUIDropArea.on('drop', function (e) {
		e.preventDefault();
		$(this).removeClass('bg-dark').removeClass('text-bg-dark');
		const file = e.originalEvent.dataTransfer.files[0];
		handleImageFile(file);
	});
	kUIFileInput.on('change', function (e) {
		const file = e.target.files[0];
		handleImageFile(file);
	});

	kUIScanButton.on('click', async function () {
		if (gCameraScanning) return;
		try {
			gCameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
			kUICameraPreview.srcObject = gCameraStream;
			kUICameraContainer.removeClass(kClassHidden);
			startCameraScan();
		} catch (err) {
			showCameraError();  // err.message
		}
	});
	kUIStopScanButton.on('click', function () {
		if (gCameraStream) {
			gCameraStream.getTracks().forEach(track => track.stop());
		}
		gCameraStream = null;
		stopCameraScan();
	});

	kUIDecodedCopyButton.on('click', function() {
		navigator.clipboard.writeText(kUIDecodedText.val()).then(() => {
			kUIDecodedCopyToast.removeClass(kClassHidden);
			setTimeout(() => { kUIDecodedCopyToast.addClass(kClassHidden); }, 2100);
		}).catch(err => {});
	});

	function handleImageFile(file) {
		if (!file) return;

		const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
		if (!allowedMimeTypes.includes(file.type)) {
			showFileError('<span class="fw-bold">Unsupported File Format.</span><br />Please upload a PNG, JPEG, GIF, or WEBP image.');
			return;
		}

		const reader = new FileReader();
		reader.onload = function (event) {
			const imageUrl = event.target.result;
			decodeQrCode(imageUrl);
		};
		reader.readAsDataURL(file);
	}
	function showFileError(msg) {
		kUIFileErrorToast.removeClass(kClassHidden).html(msg);
		setTimeout(() => { kUIFileErrorToast.addClass(kClassHidden); }, 3000);
	}

	function startCameraScan() {
		gCameraScanning = true;
		let lastScan = 0;
		const scanInterval = 200;
	
		function scanFrame(now, metadata) {
			if (!gCameraScanning) return;
		
			if (now - lastScan >= scanInterval) {
				lastScan = now;
		
				if (kUICameraPreview.videoWidth === 0) {
					if (kUICameraPreview.requestVideoFrameCallback) {
						kUICameraPreview.requestVideoFrameCallback(scanFrame);
					} else {
						requestAnimationFrame(scanFrame);
					}
					return;
				}
	
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				canvas.width = kUICameraPreview.videoWidth;
				canvas.height = kUICameraPreview.videoHeight;
				ctx.drawImage(kUICameraPreview, 0, 0, canvas.width, canvas.height);
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const code = jsQR(imageData.data, imageData.width, imageData.height);

				if (code) {
					if (processQRCode(code) === true) stopCameraScan();
				}
			}
	
			if (kUICameraPreview.requestVideoFrameCallback) {
				kUICameraPreview.requestVideoFrameCallback(scanFrame);
			} else {
				requestAnimationFrame(scanFrame);
			}
		}
	
		if (kUICameraPreview.requestVideoFrameCallback) {
			kUICameraPreview.requestVideoFrameCallback(scanFrame);
		} else {
			requestAnimationFrame(scanFrame);
		}
	}
	function stopCameraScan() {
		gCameraScanning = false;
		if (!kUICameraContainer.hasClass(kClassHidden)) kUICameraContainer.addClass(kClassHidden);
	}
	function showCameraError(msg) {
		if (msg && msg.length > 0) kUICameraErrorToast.html(msg);
		kUICameraErrorToast.removeClass(kClassHidden);
		setTimeout(() => { kUICameraErrorToast.addClass(kClassHidden); }, 4200);
	}

	function decodeQrCode(imageUrl) {
		const image = new Image();
		image.src = imageUrl;

		image.onload = function () {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			canvas.width = image.width;
			canvas.height = image.height;
			ctx.drawImage(image, 0, 0, image.width, image.height);
			const imageData = ctx.getImageData(0, 0, image.width, image.height);
			const code = jsQR(imageData.data, imageData.width, imageData.height);
			if (!processQRCode(code) === true) {
				showFileError('No QR Code found.');
			}
		};
		image.onerror = function() {
			showFileError('<span class="fw-bold">Could Not Open Image File.</span><br />Please upload a PNG, JPEG, GIF, or WEBP image.');
		}
	}
	function processQRCode(code) {
		if (code) {
			const codeData = code.data;
			if (codeData.length > 0) {
				const [codeType, codeName] = guessQrCodeType(codeData);
				kUIDecodedType.val(codeName);
				if (['url', 'call', 'sms', 'whatsapp', 'email', 'gmail', 'gEvent', 'location', 'paypal', 'crypto'].includes(codeType)) {
					kUIDecodedText.html(`<a href="${codeData}" title="Open ${codeName}" target="_blank" rel="external noopener">${codeData}</a>`);
				} else {
					kUIDecodedText.html(codeData);
				}
				kUIDecodedDialog.modal('show');
				return true;
			}
		}
		return false;
	}
	function guessQrCodeType(text) {
		const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
		if (urlRegex.test(text)) return ['url', 'Link'];

		if (text.startsWith("BEGIN:VCARD")) return ['vCard', 'vCard'];
		if (text.startsWith('MECARD:')) return ['meCard', 'meCard'];

		const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
		if (phoneRegex.test(text)) return ['call', 'Phone Number (Call)'];

		if (text.startsWith('smsto:') || text.startsWith('sms:')) return ['sms', 'Phone Number (SMS)'];

		if (text.startsWith("https://wa.me/")) return ['whatsapp', 'WhatsApp Message'];

		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (text.startsWith("mailto:") || emailRegex.test(text)) return ['email', 'Email Message'];

		if (text.startsWith("https://mail.google.com/mail/?view=cm")) return ['gmail', 'Gmail Message'];

		if (text.startsWith("BEGIN:VEVENT")) return ['vEvent', 'vEvent'];

		if (text.startsWith("https://www.google.com/calendar/event")) return ['gEvent', 'Google Calendar Event'];

		if (text.startsWith("https://www.google.com/maps") || text.startsWith("geo:")) return ['location', 'Location'];

		if (text.startsWith("WIFI:")) return ['wifi', 'Wi-Fi Credentials'];

		if (text.startsWith("https://www.paypal.me/")) return ['paypal', 'PayPal Payment'];

		const cryptoPrefixes = ["bitcoin:", "ethereum:", "litecoin:", "bitcoincash:"];
		if (cryptoPrefixes.some(prefix => text.startsWith(prefix))) return ['crypto', 'Crypto Payment'];

		return ['text', 'Text / Raw Data'];
	}
});
