$(document).ready(function () {
	const dropArea = $('#drop-area');
	const fileError = $('#file-error');
	const fileInput = $('#file-input');
	const scanButton = $('#scan-button');
	const cameraContainer = $('#camera-container');
	const cameraPreview = $('#camera-preview')[0];
	const stopScanButton = $('#stop-scan-button');
	const modal = $('#resultModal');
	const modalDecodedText = $('#modal-decoded-text');
	const modalQrCodeType = $('#modal-qr-code-type');
	const modalCopyButton = $('#modal-copy-button');
	const modalCopyNotification = $('#modal-copy-notification');
	let stream;
	let scanning = false;

	dropArea.on('dragover', function (e) {
		e.preventDefault();
		$(this).addClass('bg-dark').addClass('text-bg-dark');
	});
	dropArea.on('dragleave', function (e) {
		e.preventDefault();
		$(this).removeClass('bg-dark').removeClass('text-bg-dark');
	});
	dropArea.on('drop', function (e) {
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
			processQRCode(code);
		};
		image.onerror = function() {
			showFileError('<span class="fw-bold">Could Not Open Image File.</span><br />Please upload a PNG, JPEG, GIF, or WEBP image.');
		}
	}

	function showFileError(msg) {
		fileError.removeClass('visually-hidden');
		setTimeout(() => { fileError.addClass('visually-hidden').text(msg); }, 3000);
	}

	scanButton.on('click', async function () {
		if (scanning) return;
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
			cameraPreview.srcObject = stream;
			cameraContainer.removeClass('visually-hidden');
			scanButton.hide();
			startCameraScan();
		} catch (err) {
			alert("Error accessing camera: " + err.message);
		}
	});
	stopScanButton.on('click', function () {
		stopCameraScan();
		cameraContainer.addClass('visually-hidden');
		scanButton.show();
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
		}
		stream = null;
	});

	modalCopyButton.on('click', function() {
		navigator.clipboard.writeText(modalDecodedText.val()).then(() => {
			modalCopyNotification.removeClass('visually-hidden');
			setTimeout(() => { modalCopyNotification.addClass('visually-hidden'); }, 2100);
		}).catch(err => {});
	});

	function startCameraScan() {
		scanning = true;
		let lastScan = 0;
		const scanInterval = 100;
		
		function scanFrame(timestamp) {
			if (!scanning) return;
			
			if (timestamp - lastScan >= scanInterval) {
				lastScan = timestamp;
				
				if (cameraPreview.videoWidth === 0) {
					requestAnimationFrame(scanFrame);
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
					stopCameraScan();
					window.navigator.vibrate(200);
					processQRCode(code);
				}
			}
			requestAnimationFrame(scanFrame);
		}
		requestAnimationFrame(scanFrame);
	}
	function stopCameraScan(){
		scanning = false;
	}

	function processQRCode(code) {
		if (code) {
			let codeData = code.data;
			let codeType = guessQrCodeType(codeData);
			modalQrCodeType.val(codeType);
			modalDecodedText.val(codeData);
			modal.modal('show');
		} else {
			showFileError('No QR Code found.');
		}
	}
	function guessQrCodeType(text) {
		const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
		if (urlRegex.test(text)) return 'URL';

		if (text.startsWith("BEGIN:VCARD")) return 'vCard';
		if (text.startsWith('MECARD:')) return 'meCard';

		const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
		if (phoneRegex.test(text)) return 'Phone Number (Call)';

		if (text.startsWith('smsto:') || text.startsWith('sms:')) return 'Phone Number (SMS)';

		if (text.startsWith("https://wa.me/")) return 'WhatsApp Message';

		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (text.startsWith("mailto:") || emailRegex.test(text)) return 'Email Message';

		if (text.startsWith("https://mail.google.com/mail/?view=cm")) return 'Gmail Message';

		if (text.startsWith("BEGIN:VEVENT")) return 'vEvent';

		if (text.startsWith("https://www.google.com/calendar/event")) return 'Google Calendar Event';

		if (text.startsWith("https://www.google.com/maps") || text.startsWith("geo:")) return 'Location';

		if (text.startsWith("WIFI:")) return 'Wi-Fi Credentials';

		if (text.startsWith("https://www.paypal.me/")) return 'PayPal Payment';

		const cryptoPrefixes = ["bitcoin:", "ethereum:", "litecoin:", "bitcoincash:"];
		if (cryptoPrefixes.some(prefix => text.startsWith(prefix))) return 'Crypto Payment';

		return 'Text / Raw Data';
	}
});
