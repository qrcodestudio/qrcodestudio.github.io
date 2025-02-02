$(document).ready(function () {
	const kClassHidden = 'visually-hidden';
	const kUIDropArea = $('#drop-area');
	const fileError = $('#file-error');
	const fileInput = $('#file-input');
	const scanButton = $('#scan-button');
	const cameraContainer = $('#camera-container');
	const cameraPreview = $('#camera-preview')[0];
	const stopScanButton = $('#stop-scan-button');
	const cameraError = $('#camera-error');
	const modal = $('#resultModal');
	const modalDecodedText = $('#modal-decoded-text');
	const modalQrCodeType = $('#modal-qr-code-type');
	const modalCopyButton = $('#modal-copy-button');
	const modalCopyNotification = $('#modal-copy-notification');
	let stream;
	let scanning = false;

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

	fileInput.on('change', function (e) {
		const file = e.target.files[0];
		handleImageFile(file);
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

	function showFileError(msg) {
		fileError.removeClass(kClassHidden).html(msg);
		setTimeout(() => { fileError.addClass(kClassHidden); }, 3000);
	}
	function showCameraError(msg) {
		if (msg && msg.length > 0) cameraError.html(msg);
		cameraError.removeClass(kClassHidden);
		setTimeout(() => { cameraError.addClass(kClassHidden); }, 4200);
	}

	scanButton.on('click', async function () {
		if (scanning) return;
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
			cameraPreview.srcObject = stream;
			cameraContainer.removeClass(kClassHidden);
			startCameraScan();
		} catch (err) {
			showCameraError();  // err.message
		}
	});
	stopScanButton.on('click', function () {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
		}
		stream = null;
		stopCameraScan();
	});

	modalCopyButton.on('click', function() {
		navigator.clipboard.writeText(modalDecodedText.val()).then(() => {
			modalCopyNotification.removeClass(kClassHidden);
			setTimeout(() => { modalCopyNotification.addClass(kClassHidden); }, 2100);
		}).catch(err => {});
	});

	function startCameraScan() {
		scanning = true;
		let lastScan = 0;
		const scanInterval = 200;
	
		function scanFrame(now, metadata) {
			if (!scanning) return;
		
			if (now - lastScan >= scanInterval) {
				lastScan = now;
		
				if (cameraPreview.videoWidth === 0) {
					if (cameraPreview.requestVideoFrameCallback) {
						cameraPreview.requestVideoFrameCallback(scanFrame);
					} else {
						requestAnimationFrame(scanFrame);
					}
					return;
				}
	
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				canvas.width = cameraPreview.videoWidth;
				canvas.height = cameraPreview.videoHeight;
				ctx.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const code = jsQR(imageData.data, imageData.width, imageData.height);

				if (code) {
					if (processQRCode(code) === true) stopCameraScan();
				}
			}
	
			if (cameraPreview.requestVideoFrameCallback) {
				cameraPreview.requestVideoFrameCallback(scanFrame);
			} else {
				requestAnimationFrame(scanFrame);
			}
		}
	
		if (cameraPreview.requestVideoFrameCallback) {
			cameraPreview.requestVideoFrameCallback(scanFrame);
		} else {
			requestAnimationFrame(scanFrame);
		}
	}
	function stopCameraScan() {
		scanning = false;
		if (!cameraContainer.hasClass(kClassHidden)) cameraContainer.addClass(kClassHidden);
	}

	function processQRCode(code) {
		if (code) {
			const codeData = code.data;
			if (codeData.length > 0) {
				const [codeType, codeName] = guessQrCodeType(codeData);
				modalQrCodeType.val(codeName);
				if (['url', 'call', 'sms', 'whatsapp', 'email', 'gmail', 'gEvent', 'location', 'paypal', 'crypto'].includes(codeType)) {
					modalDecodedText.html(`<a href="${codeData}" title="Open ${codeName}" target="_blank" rel="external noopener">${codeData}</a>`);
				} else {
					modalDecodedText.html(codeData);
				}
				modal.modal('show');
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
