$(document).ready(function () {
	const kPrefsAppKey = '.QRCodeDecoder';
	const kPrefsSafetyCheckURL = 'https://qrcodesafebrowsingcheck.qrcodestudioapp.workers.dev/';
	const kCodeSafety = { unknown : 0, safe : 1, malicious : -1, pending : 2 };
	const kQRMediaFile = 'file';
	const kQRMediaCamera = 'camera';
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
	const kUIFluffItems = $('.qr-ui-fluff');
	const kUIDarkThemeItems = $('[data-bs-theme]');
	const kUIPrefsDarkMode = $('[name="qr-ui-prefs-darkmode"]');
	const kUIPrefsHideFluff = $('#qr-ui-prefs-nofluff');
	const kUIStatsPeriod = $('[name="qr-ui-stats-period"]');
	const kUIStatsValues = $('.qr-stats-value');
	const kUIHistoryContainer = $('#qr-history-container');
	const kUIHistoryTrashButton = $('#qr-history-trash-button');
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

	kUIStatsPeriod.on('click', function() {
		const mode = $(this).val();
		prefsSave('uiStatsPeriod', mode);
		uiStatsPeriod(mode);
	});
	$(document).on('click', '.qr-history-item', function() {
		processQRCode({data: $(this).data('qr-code')}, $(this).data('qr-media'), true);
	});
	kUIHistoryTrashButton.on('click', function() {
		historyClear();
	});
	kUIPrefsDarkMode.on('click', function() {
		const mode = $(this).val();
		prefsSave('uiDarkMode', mode);
		uiDarkMode(mode);
	});
	kUIPrefsHideFluff.on('change', function() {
		const state = $(this).is(':checked');
		prefsSave('uiHideFluff', state);
		uiHideFluff(state);
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
			statsAddScan(kQRMediaFile);
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
		statsAddScan(kQRMediaCamera);

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
					if (processQRCode(code, kQRMediaCamera) === true) stopCameraScan();
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
			if (!processQRCode(code, kQRMediaFile) === true) {
				showFileError('No QR Code found.');
			}
		};
		image.onerror = function() {
			showFileError('<span class="fw-bold">Could Not Open Image File.</span><br />Please upload a PNG, JPEG, GIF, or WEBP image.');
		}
	}
	function processQRCode(code, media, nostats=false) {
		if (code) {
			const codeData = code.data;
			if (codeData.length > 0) {
				const codeType = guessQrCodeType(codeData);
				const codeName = utilQRName(codeType);
				let codeSafety = 0;

				if (nostats === false) {
					statsAddFound(media);
					historyAdd(media, codeType, codeData);
				}

				if (codeType === 'url') verifyURLSafety(codeData);

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
		if (urlRegex.test(text)) return 'url';

		if (text.startsWith("BEGIN:VCARD")) return 'vCard';
		if (text.startsWith('MECARD:')) return 'meCard';

		const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
		if (phoneRegex.test(text)) return 'call';

		if (text.startsWith('smsto:') || text.startsWith('sms:')) return 'sms';

		if (text.startsWith("https://wa.me/")) return 'whatsapp';

		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (text.startsWith("mailto:") || emailRegex.test(text)) return 'email';

		if (text.startsWith("https://mail.google.com/mail/?view=cm")) return 'gmail';

		if (text.startsWith("BEGIN:VEVENT")) return 'vEvent';

		if (text.startsWith("https://www.google.com/calendar/event")) return 'gEvent';

		if (text.startsWith("https://www.google.com/maps") || text.startsWith("geo:")) return 'location';

		if (text.startsWith("WIFI:")) return 'wifi';

		if (text.startsWith("https://www.paypal.me/")) return 'paypal';

		const cryptoPrefixes = ["bitcoin:", "ethereum:", "litecoin:", "bitcoincash:"];
		if (cryptoPrefixes.some(prefix => text.startsWith(prefix))) return 'crypto';

		return 'text';
	}
	function verifyURLSafety(url) {
console.log('verifyURLSafety', url);
		const urlObj = new URL(url);
		if (!urlObj) return;
		urlObj.search = '';
		urlObj.hash = '';
		const cleanUrl = urlObj.toString();
console.log('verifyURLSafety cleanUrl', cleanUrl);

		urlSafetyDB((readStore) => {
			const getRequest = readStore.get(cleanUrl);
			
			getRequest.onsuccess = (event) => {
				const result = event.target.result;
				if (result) {
console.log('DB Object retrieved:', cleanUrl, result);
					uiURLSafety(result);
				} else {
					const requestBody = JSON.stringify({url : cleanUrl});
console.log('No matching object found -> checking ...', cleanUrl, requestBody);
					//fetch(`https://cors-anywhere.herokuapp.com/${kPrefsSafetyCheckURL}`, {
					fetch(kPrefsSafetyCheckURL, {
						method: 'POST',
						mode: 'cors',
						headers: { 'Content-Type': 'application/json', 'Accept': '*/*', 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://qrcodestudio.app/qr-code-decoder/' },
						body: requestBody
					})
					.then((response) => { console.log(response.statusText); return response.json(); })
					.then((data) => {
console.log(data);
						urlSafetyDB((saveStore) => {
							const newObject = { url: cleanUrl, safe: data.threatFound, description: 'TODO This is a sample.' };
							const addRequest = saveStore.add(newObject);
							addRequest.onsuccess = () => {
								console.log('Object added successfully.');
								uiURLSafety(newObject);
							};
							addRequest.onerror = (event) => {
								console.error('Add operation error:', event.target.error);
							};
						})
					}).catch((error) => {
						console.error(`Fetch error: ${error.message}`);
					});
				}
			};
			getRequest.onerror = (event) => { };
		});
	}
	function urlSafetyDB(callback) {
console.log('urlSafetyDB');
		const request = indexedDB.open(`QRCodeStudioApp${kPrefsAppKey}`, 1);
		request.onupgradeneeded = (event) => {
console.log('urlSafetyDB onupgradeneeded');
			const db = event.target.result;
			if (!db.objectStoreNames.contains('urlSafety')) {
				db.createObjectStore('urlSafety', { keyPath: 'url', autoIncrement: false });
			}
		};
		request.onsuccess = (event) => {
console.log('urlSafetyDB onsuccess');
			const db = event.target.result;
			const transaction = db.transaction('urlSafety', 'readwrite');
			const objectStore = transaction.objectStore('urlSafety');
			callback(objectStore);
		};
		request.onerror = (event) => {
console.log('urlSafetyDB onerror');
		};
	}
	function uiURLSafety(urlRec) {
console.log('uiURLSafety', urlRec);
		if (urlRec.safe === true) {

		} else {

		}
	}

	function prefsRead(key, value) {
		return window.localStorage.getItem(`QRCodeStudioApp${kPrefsAppKey}-${key}`) || value;
	}
	function prefsSave(key, value) {
		window.localStorage.setItem(`QRCodeStudioApp${kPrefsAppKey}-${key}`, value);
	}

	function initUI() {
		uiDarkMode(prefsRead('uiDarkMode', 'auto'));
		uiHideFluff((/true/i).test(prefsRead('uiHideFluff', false)));
		uiStatsPeriod(prefsRead('uiStatsPeriod', 'all'));
		uiStatsRefresh(statsRead());
		uiHistoryRefresh(historyRead());
	}
	function uiDarkMode(mode) {
		kUIPrefsDarkMode.filter(`[value="${mode}"]`).prop('checked', true);

		let theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
		switch(mode) {
			case 'on':
				theme = 'dark'; break;
			case 'off':
				theme = 'light'; break;
		}
		kUIDarkThemeItems.attr('data-bs-theme', theme);
	}
	function uiHideFluff(state) {
		kUIPrefsHideFluff.prop('checked', state);

		if (state === true) {
			if (!kUIFluffItems.hasClass(kClassHidden)) kUIFluffItems.addClass(kClassHidden);
		} else {
			if (kUIFluffItems.hasClass(kClassHidden)) kUIFluffItems.removeClass(kClassHidden);
		}
	}
	function uiStatsPeriod(mode) {
		kUIStatsPeriod.filter(`[value="${mode}"]`).prop('checked', true);
	}
	function statsAddScan(media) {
		statsAdd('scan', media);
	}
	function statsAddFound(media) {
		statsAdd('found', media);
	}
	function statsAdd(type, media) {
		const act = {'scan':'Scans', 'found':'Found'}[type];
		const key = `${media}${act}`;
		let dateCode = utilDateCode(0);
		let data = statsRead();
		data.all = data.all || {};
		data.all[key] = (data.all[key] || 0) + 1;
		data.daily = data.daily || {};
		data.daily[dateCode] = data.daily[dateCode] || {};
		data.daily[dateCode][key] = (data.daily[dateCode][key] || 0) + 1;

		dateCode = utilDateCode(365);
		data.daily = Object.fromEntries( Object.entries(data.daily).filter(([key]) => key < dateCode) );

		statsSave(data);
		uiStatsRefresh(data);
	}
	function statsRead() {
		let stats;
		try {
			stats = JSON.parse(prefsRead('userStats', ''));
		} catch (err) {
			stats = {};
		}
		return stats;
	}
	function statsSave(stats) {
		if (!stats) return;
		prefsSave('userStats', JSON.stringify(stats));
	}
	function uiStatsFill(stats) {
		kUIStatsValues.each(function() {
			const key = $(this).data('qr-stats-key');
			$(this).html(stats[key] || 0);
		});
	}
	function uiStatsRefresh(data) {
		let stats = {};
		let entries = [];
		let totalScans = 0;
		let totalFound = 0;
		const period = prefsRead('uiStatsPeriod', 'all');

		switch(period) {
			case 'all':
				entries = [data.all || {}]; break;
			case 'today':
				entries = [(data.daily || {})[utilDateCode(0)] || {}]; break;
			case 'last7':
			case 'week':
				for (let i = 0; i < 7; i++) { entries.push((data.daily || {})[utilDateCode(i)] || {}); }; break;
			case 'last30':
			case 'month':
					for (let i = 0; i < 30; i++) { entries.push((data.daily || {})[utilDateCode(i)] || {}); }; break;
			case 'last365':
			case 'year':
				for (let i = 0; i < 365; i++) { entries.push((data.daily || {})[utilDateCode(i)] || {}); }; break;
		}
		['fileScans', 'fileFound', 'cameraScans', 'cameraFound'].forEach(key => {
			stats[key] = 0;
			entries.forEach((entry) => {
				stats[key] += entry[key] || 0;
				if (key.includes('Scans')) totalScans += stats[key];
				if (key.includes('Found')) totalFound += stats[key];
			});
		});
		stats.totalScans = totalScans;
		stats.totalFound = totalFound;

		uiStatsFill(stats);
	}

	function historyRead() {
		let history;
		try {
			history = JSON.parse(prefsRead('scanHistory', ''));
		} catch (err) {
			history = [];
		}
		return history;
	}
	function historySave(data) {
		if (!data) return;
		prefsSave('scanHistory', JSON.stringify(data));

	}
	function historyAdd(media, type, value) {
		const dateCode = utilDateCode(0);
		const item = { date : dateCode, media : media, type : type, value : value };
		let data = historyRead();
		data.unshift(item);
		historySave(data);
		uiHistoryRefresh(data);
	}
	function historyClear() {
		historySave([]);
		uiHistoryRefresh([]);
	}
	function uiHistoryRefresh(data) {
		const dates = [...new Set(data.map(dt => dt.date))].sort().reverse();
		const html = dates.map((date) => {
			const header = `<div class="fw-bold fs-6 mb-1">${date}</div>`;
			const items = data.filter(item => item.date == date).map(item => `<tr role="button" class="qr-history-item" data-qr-code="${item.value}" data-qr-media="${item.media}"><td><span class="qr-icon-${item.media}"></span></td><td class="text-wrap text-break"><div class="fw-bold">${utilQRName(item.type)}</div>${item.value}</td></tr>`).join('');
			return `${header}<table class="table table-sm table-bordered table-striped table-hover small mt-0 mb-2"><tbody>${items}</tbody></table>`;
		}).join('');
		kUIHistoryContainer.empty().html(html);
	}

	function utilDateCode(offset) {
		const timestamp = Date.now();
		let dt = new Date(timestamp - offset * 24 * 60 * 60 * 1000);
		const year = dt.getFullYear();
		const month = String(dt.getMonth() + 1).padStart(2, '0');
		const day = String(dt.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};
	function utilQRName(type) {
		return {
			url: 'Link',
			vCard: 'vCard',
			meCard: 'meCard',
			call: 'Phone Number (Call)',
			sms: 'Phone Number (SMS)',
			whatsapp: 'WhatsApp Message',
			email: 'Email Message',
			gmail: 'Gmail Message',
			vEvent: 'vEvent',
			gEvent: 'Google Calendar Event',
			location: 'Location',
			wifi: 'Wi-Fi Credentials',
			paypal: 'PayPal Payment',
			crypto: 'Crypto Payment'
		}[type] || 'Text / Raw Data';
	};

	initUI();
});
