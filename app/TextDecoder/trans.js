(function () {
	"use strict";

	var form = document.getElementById("translator-form");
	if (!form) {
		return;
	}

	var sourceEncoding = form.querySelector('[name="e"]');
	var targetEncoding = form.querySelector('[name="t"]');
	var sourceTextarea = form.querySelector('[name="q"]');
	var targetTextarea = document.getElementById("target-text");
	var sourceUrlCheckbox = form.querySelector('[name="u"]');
	var targetUrlCheckbox = form.querySelector('[name="r"]');
	var copyButton = document.getElementById("copy-btn");
	var keyboardSourceTextarea = document.getElementById("keyboard-source-text");
	var keyboardTargetTextarea = document.getElementById("keyboard-target-text");
	var keyboardCopyButton = document.getElementById("keyboard-copy-btn");
	var statusNode = document.getElementById("status");
	var runToken = 0;

	var keyboardMap = {
		"r": "ㄱ", "R": "ㄲ", "s": "ㄴ", "e": "ㄷ", "E": "ㄸ", "f": "ㄹ",
		"a": "ㅁ", "q": "ㅂ", "Q": "ㅃ", "t": "ㅅ", "T": "ㅆ", "d": "ㅇ",
		"w": "ㅈ", "W": "ㅉ", "c": "ㅊ", "z": "ㅋ", "x": "ㅌ", "v": "ㅍ",
		"g": "ㅎ", "k": "ㅏ", "o": "ㅐ", "i": "ㅑ", "O": "ㅒ", "j": "ㅓ",
		"p": "ㅔ", "u": "ㅕ", "P": "ㅖ", "h": "ㅗ", "y": "ㅛ", "n": "ㅜ",
		"b": "ㅠ", "m": "ㅡ", "l": "ㅣ"
	};

	var choseongList = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
	var jungseongList = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
	var jongseongList = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
	var complexVowelMap = {
		"ㅗㅏ": "ㅘ",
		"ㅗㅐ": "ㅙ",
		"ㅗㅣ": "ㅚ",
		"ㅜㅓ": "ㅝ",
		"ㅜㅔ": "ㅞ",
		"ㅜㅣ": "ㅟ",
		"ㅡㅣ": "ㅢ"
	};
	var complexFinalMap = {
		"ㄱㅅ": "ㄳ",
		"ㄴㅈ": "ㄵ",
		"ㄴㅎ": "ㄶ",
		"ㄹㄱ": "ㄺ",
		"ㄹㅁ": "ㄻ",
		"ㄹㅂ": "ㄼ",
		"ㄹㅅ": "ㄽ",
		"ㄹㅌ": "ㄾ",
		"ㄹㅍ": "ㄿ",
		"ㄹㅎ": "ㅀ",
		"ㅂㅅ": "ㅄ"
	};
	var finalSplitMap = {
		"ㄳ": ["ㄱ", "ㅅ"],
		"ㄵ": ["ㄴ", "ㅈ"],
		"ㄶ": ["ㄴ", "ㅎ"],
		"ㄺ": ["ㄹ", "ㄱ"],
		"ㄻ": ["ㄹ", "ㅁ"],
		"ㄼ": ["ㄹ", "ㅂ"],
		"ㄽ": ["ㄹ", "ㅅ"],
		"ㄾ": ["ㄹ", "ㅌ"],
		"ㄿ": ["ㄹ", "ㅍ"],
		"ㅀ": ["ㄹ", "ㅎ"],
		"ㅄ": ["ㅂ", "ㅅ"]
	};
	var choseongIndex = createIndexMap(choseongList);
	var jungseongIndex = createIndexMap(jungseongList);
	var jongseongIndex = createIndexMap(jongseongList);

	var decoderEncodingMap = {
		"windows-1252": "windows-1252",
		"cp949": "euc-kr",
		"shift-jis": "shift-jis",
		"cp932": "shift-jis",
		"cp936": "gbk",
		"utf-8": "utf-8",
		"utf-16le": "utf-16le",
		"utf-16be": "utf-16be"
	};

	var legacyEncodingByteRanges = {
		"cp949": {
			leadRanges: [[0x81, 0xFE]],
			trailRanges: [[0x41, 0x5A], [0x61, 0x7A], [0x81, 0xFE]]
		},
		"shift-jis": {
			leadRanges: [[0x81, 0x9F], [0xE0, 0xFC]],
			trailRanges: [[0x40, 0x7E], [0x80, 0xFC]]
		},
		"cp932": {
			leadRanges: [[0x81, 0x9F], [0xE0, 0xFC]],
			trailRanges: [[0x40, 0x7E], [0x80, 0xFC]]
		},
		"cp936": {
			leadRanges: [[0x81, 0xFE]],
			trailRanges: [[0x40, 0x7E], [0x80, 0xFE]]
		}
	};

	var reverseEncoderCache = Object.create(null);

	var forcedTargetBySource = {
		"base64": "utf-8",
		"gzipbase64": "utf-8",
		"basehangul": "utf-8",
		"gzipbasehangul": "utf-8",
		"quoted-printable": "utf-8",
		"unicode": "utf-8",
		"monitable": "mwtable"
	};

	function UnsupportedConversionError(message, options) {
		this.name = "UnsupportedConversionError";
		this.message = message;
		this.retryable = !!(options && options.retryable);
	}
	UnsupportedConversionError.prototype = Object.create(Error.prototype);
	UnsupportedConversionError.prototype.constructor = UnsupportedConversionError;

	function setStatus(message, isError) {
		if (!statusNode) {
			return;
		}
		statusNode.textContent = message || "";
		statusNode.style.color = isError ? "#b42318" : "";
	}

	function createIndexMap(list) {
		var map = Object.create(null);
		for (var i = 0; i < list.length; i += 1) {
			map[list[i]] = i;
		}
		return map;
	}

	function isConsonant(char) {
		return Object.prototype.hasOwnProperty.call(choseongIndex, char);
	}

	function isVowel(char) {
		return Object.prototype.hasOwnProperty.call(jungseongIndex, char);
	}

	function combineSyllable(initial, medial, final) {
		if (!initial && !medial && !final) {
			return "";
		}
		if (!initial && medial) {
			return medial;
		}
		if (initial && !medial) {
			return initial;
		}
		var initialIndex = choseongIndex[initial];
		var medialIndex = jungseongIndex[medial];
		var finalIndex = jongseongIndex[final || ""];
		if (initialIndex === undefined || medialIndex === undefined || finalIndex === undefined) {
			return (initial || "") + (medial || "") + (final || "");
		}
		return String.fromCharCode(0xAC00 + (initialIndex * 21 + medialIndex) * 28 + finalIndex);
	}

	function convertKeyboardToHangul(text) {
		var mapped = [];
		var i;
		for (i = 0; i < text.length; i += 1) {
			var original = text.charAt(i);
			mapped.push(keyboardMap[original] || original);
		}

		var result = "";
		var initial = "";
		var medial = "";
		var final = "";

		function flush() {
			result += combineSyllable(initial, medial, final);
			initial = "";
			medial = "";
			final = "";
		}

		for (i = 0; i < mapped.length; i += 1) {
			var current = mapped[i];
			var next = mapped[i + 1];

			if (!isConsonant(current) && !isVowel(current)) {
				flush();
				result += current;
				continue;
			}

			if (isVowel(current)) {
				if (!initial) {
					initial = "ㅇ";
				}

				if (!medial) {
					medial = current;
					continue;
				}

				var combinedMedial = complexVowelMap[medial + current];
				if (combinedMedial) {
					medial = combinedMedial;
					continue;
				}

				if (final) {
					var splitFinal = finalSplitMap[final];
					if (splitFinal) {
						result += combineSyllable(initial, medial, splitFinal[0]);
						initial = splitFinal[1];
					} else {
						result += combineSyllable(initial, medial, "");
						initial = final;
					}
					medial = current;
					final = "";
					continue;
				}

				flush();
				initial = "ㅇ";
				medial = current;
				continue;
			}

			if (!initial) {
				initial = current;
				continue;
			}

			if (!medial) {
				result += initial;
				initial = current;
				continue;
			}

			if (!final) {
				if (next && isVowel(next)) {
					flush();
					initial = current;
					continue;
				}
				final = current;
				continue;
			}

			var combinedFinal = complexFinalMap[final + current];
			if (combinedFinal && !(next && isVowel(next))) {
				final = combinedFinal;
				continue;
			}

			flush();
			initial = current;
		}

		flush();
		return result;
	}

	function normalizeInput(text, decodeUrl) {
		if (!decodeUrl) {
			return text;
		}
		try {
			return decodeURIComponent(text.replace(/\+/g, "%20"));
		} catch (error) {
			throw new Error("URL decode에 실패했습니다. 인코딩된 문자열인지 확인해 주세요.");
		}
	}

	function normalizeOutput(text, encodeUrl) {
		return encodeUrl ? encodeURIComponent(text) : text;
	}

	function base64ToBytes(base64Text) {
		var cleaned = (base64Text || "").replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
		if (!cleaned) {
			return new Uint8Array();
		}
		var padLength = cleaned.length % 4;
		if (padLength === 2) {
			cleaned += "==";
		} else if (padLength === 3) {
			cleaned += "=";
		} else if (padLength === 1) {
			throw new Error("base64 문자열 길이가 올바르지 않습니다.");
		}

		var binary;
		try {
			binary = atob(cleaned);
		} catch (error) {
			throw new Error("base64 디코딩에 실패했습니다.");
		}
		var bytes = new Uint8Array(binary.length);
		for (var i = 0; i < binary.length; i += 1) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	}

	function bytesToBase64(bytes) {
		if (!bytes || bytes.length === 0) {
			return "";
		}
		var chunk = 32768;
		var binary = "";
		for (var i = 0; i < bytes.length; i += chunk) {
			binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
		}
		return btoa(binary);
	}

	// Based on basehangul-javascript implementation.
	var baseHangulTable = "가각간갇갈갉갊감갑값갓갔강갖갗같갚갛개객갠갤갬갭갯갰갱갸갹갼걀걋걍걔걘걜거걱건걷걸걺검겁것겄겅겆겉겊겋게겐겔겜겝겟겠겡겨격겪견겯결겸겹겻겼경곁계곈곌곕곗고곡곤곧골곪곬곯곰곱곳공곶과곽관괄괆괌괍괏광괘괜괠괩괬괭괴괵괸괼굄굅굇굉교굔굘굡굣구국군굳굴굵굶굻굼굽굿궁궂궈궉권궐궜궝궤궷귀귁귄귈귐귑귓규균귤그극근귿글긁금급긋긍긔기긱긴긷길긺김깁깃깅깆깊까깍깎깐깔깖깜깝깟깠깡깥깨깩깬깰깸깹깻깼깽꺄꺅꺌꺼꺽꺾껀껄껌껍껏껐껑께껙껜껨껫껭껴껸껼꼇꼈꼍꼐꼬꼭꼰꼲꼴꼼꼽꼿꽁꽂꽃꽈꽉꽐꽜꽝꽤꽥꽹꾀꾄꾈꾐꾑꾕꾜꾸꾹꾼꿀꿇꿈꿉꿋꿍꿎꿔꿜꿨꿩꿰꿱꿴꿸뀀뀁뀄뀌뀐뀔뀜뀝뀨끄끅끈끊끌끎끓끔끕끗끙끝끼끽낀낄낌낍낏낑나낙낚난낟날낡낢남납낫났낭낮낯낱낳내낵낸낼냄냅냇냈냉냐냑냔냘냠냥너넉넋넌널넒넓넘넙넛넜넝넣네넥넨넬넴넵넷넸넹녀녁년녈념녑녔녕녘녜녠노녹논놀놂놈놉놋농높놓놔놘놜놨뇌뇐뇔뇜뇝뇟뇨뇩뇬뇰뇹뇻뇽누눅눈눋눌눔눕눗눙눠눴눼뉘뉜뉠뉨뉩뉴뉵뉼늄늅늉느늑는늘늙늚늠늡늣능늦늪늬늰늴니닉닌닐닒님닙닛닝닢다닥닦단닫달닭닮닯닳담답닷닸당닺닻닿대댁댄댈댐댑댓댔댕댜더덕덖던덛덜덞덟덤덥덧덩덫덮데덱덴델뎀뎁뎃뎄뎅뎌뎐뎔뎠뎡뎨뎬도독돈돋돌돎돐돔돕돗동돛돝돠돤돨돼됐되된될됨됩됫됴두둑둔둘둠둡둣둥둬뒀뒈뒝뒤뒨뒬뒵뒷뒹듀듄듈듐듕드득든듣들듦듬듭듯등듸디딕딘딛딜딤딥딧딨딩딪따딱딴딸땀땁땃땄땅땋때땍땐땔땜땝땟땠땡떠떡떤떨떪떫떰떱떳떴떵떻떼떽뗀뗄뗌뗍뗏뗐뗑뗘뗬또똑똔똘똥똬똴뙈뙤뙨뚜뚝뚠뚤뚫뚬뚱뛔뛰뛴뛸뜀뜁뜅뜨뜩뜬뜯뜰뜸뜹뜻띄띈띌띔띕띠띤띨띰띱띳띵라락란랄람랍랏랐랑랒랖랗래랙랜랠램랩랫랬랭랴략랸럇량러럭런럴럼럽럿렀렁렇레렉렌렐렘렙렛렝려력련렬렴렵렷렸령례롄롑롓로록론롤롬롭롯롱롸롼뢍뢨뢰뢴뢸룀룁룃룅료룐룔룝룟룡루룩룬룰룸룹룻룽뤄뤘뤠뤼뤽륀륄륌륏륑류륙륜률륨륩륫륭르륵른를름릅릇릉릊릍릎리릭린릴림립릿링마막만많맏말맑맒맘맙맛망맞맡맣매맥맨맬맴맵맷맸맹맺먀먁먈먕머먹먼멀멂멈멉멋멍멎멓메멕멘멜멤멥멧멨멩며멱면멸몃몄명몇몌모목몫몬몰몲몸몹못몽뫄뫈뫘뫙뫼묀묄묍묏묑묘묜묠묩묫무묵묶문묻물묽묾뭄뭅뭇뭉뭍뭏뭐뭔뭘뭡뭣뭬뮈뮌뮐뮤뮨뮬뮴뮷므믄믈믐믓미믹민믿밀밂밈밉밋밌밍및밑바박밖밗반받발밝밞밟밤밥밧방밭배백밴밸뱀뱁뱃뱄뱅뱉뱌뱍뱐뱝버벅번벋벌벎범법벗벙벚베벡벤벧벨벰벱벳벴벵벼벽변별볍볏볐병볕볘볜보복볶본볼봄봅봇봉봐봔봤봬뵀뵈뵉뵌뵐뵘뵙뵤뵨부북분붇불붉붊붐붑붓붕붙붚붜붤붰붸뷔뷕뷘뷜뷩뷰뷴뷸븀븃븅브븍븐블븜븝븟비빅빈빌빎빔빕빗";
	var baseHangulPadding = "흐";

	function baseHangulToBytes(value) {
		var cleaned = (value || "").replace(/\s+/g, "");
		if (!cleaned) {
			return new Uint8Array();
		}
		if (cleaned.length % 4 !== 0) {
			throw new Error("basehangul 문자열 길이가 올바르지 않습니다.");
		}
		var chars = cleaned.split("");
		var baseData = new Array(chars.length);
		for (var i = 0; i < chars.length; i += 1) {
			var index = baseHangulTable.indexOf(chars[i]);
			if (index === -1 && chars[i] !== baseHangulPadding) {
				throw new Error("basehangul 문자열에 유효하지 않은 문자가 있습니다.");
			}
			baseData[i] = index;
		}

		var result = [];
		var len = baseData.length;
		var a;
		var b;
		var c;
		var d;
		for (var j = 0; j < len; j += 1) {
			a = baseData[j];
			b = baseData[++j];
			c = baseData[++j];
			d = baseData[++j];
			if (a === -1 || b === undefined || c === undefined || d === undefined) {
				throw new Error("basehangul 문자열 형식이 올바르지 않습니다.");
			}

			result.push((a >> 2) & 255);
			if (b === -1) {
				break;
			}
			result.push((a & 3) << 6 | b >> 4);
			if (b === -1 || c === -1) {
				break;
			}
			result.push((b & 15) << 4 | c >> 6);
			if (c === -1 || d === -1) {
				break;
			}
			result.push((c & 63) << 2 | (d > 1023 ? d & 3 : d >> 8));
			if (d > 1023) {
				break;
			}
			result.push(d & 255);
		}
		return new Uint8Array(result);
	}

	function bytesToBaseHangul(bytes) {
		if (!bytes || bytes.length === 0) {
			return "";
		}
		var len = bytes.length;
		var result = [];
		var a;
		var b;
		var c;
		var d;
		var e;
		for (var i = 0; i < len; i += 1) {
			result.push(
				baseHangulTable[(a = bytes[i] & 255) << 2 | (b = bytes[++i] & 255) >> 6],
				i < len ? baseHangulTable[(b & 63) << 4 | (c = bytes[++i] & 255) >> 4] : baseHangulPadding,
				i < len ? baseHangulTable[(c & 15) << 6 | (d = bytes[++i] & 255) >> 2] : baseHangulPadding,
				(d = d & 3, e = bytes[++i] & 255, i) < len ? baseHangulTable[d << 8 | e] : i === len ? baseHangulTable[d | 1024] : baseHangulPadding
			);
		}
		return result.join("");
	}

	function quotedPrintableToBytes(text) {
		var source = (text || "").replace(/=\r?\n/g, "");
		var bytes = [];
		for (var i = 0; i < source.length; i += 1) {
			var char = source.charAt(i);
			if (char === "=" && /^[0-9A-Fa-f]{2}$/.test(source.substr(i + 1, 2))) {
				bytes.push(parseInt(source.substr(i + 1, 2), 16));
				i += 2;
				continue;
			}
			bytes.push(source.charCodeAt(i) & 255);
		}
		return new Uint8Array(bytes);
	}

	function bytesToQuotedPrintable(bytes) {
		if (!bytes || bytes.length === 0) {
			return "";
		}
		var output = "";
		for (var i = 0; i < bytes.length; i += 1) {
			var code = bytes[i];
			var safePrintable = (code >= 33 && code <= 60) || (code >= 62 && code <= 126);
			output += safePrintable ? String.fromCharCode(code) : "=" + code.toString(16).toUpperCase().padStart(2, "0");
		}
		return output;
	}

	function decodeUnicodeEscapes(text) {
		var result = text || "";
		result = result.replace(/\\u([0-9a-fA-F]{4})/g, function (_, hex) {
			return String.fromCharCode(parseInt(hex, 16));
		});
		result = result.replace(/\\x([0-9a-fA-F]{2})/g, function (_, hex) {
			return String.fromCharCode(parseInt(hex, 16));
		});
		result = result.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t");
		return result.replace(/\\\\/g, "\\");
	}

	function toUnicodeEscapes(text) {
		var output = "";
		for (var i = 0; i < text.length; i += 1) {
			output += "\\u" + text.charCodeAt(i).toString(16).padStart(4, "0");
		}
		return output;
	}

	function encodeUtf16(str, littleEndian) {
		var bytes = new Uint8Array(str.length * 2);
		for (var i = 0; i < str.length; i += 1) {
			var code = str.charCodeAt(i);
			if (littleEndian) {
				bytes[i * 2] = code & 255;
				bytes[i * 2 + 1] = code >>> 8;
			} else {
				bytes[i * 2] = code >>> 8;
				bytes[i * 2 + 1] = code & 255;
			}
		}
		return bytes;
	}

	var cp1252ExtraMap = {
		0x20AC: 128,
		0x201A: 130,
		0x0192: 131,
		0x201E: 132,
		0x2026: 133,
		0x2020: 134,
		0x2021: 135,
		0x02C6: 136,
		0x2030: 137,
		0x0160: 138,
		0x2039: 139,
		0x0152: 140,
		0x017D: 142,
		0x2018: 145,
		0x2019: 146,
		0x201C: 147,
		0x201D: 148,
		0x2022: 149,
		0x2013: 150,
		0x2014: 151,
		0x02DC: 152,
		0x2122: 153,
		0x0161: 154,
		0x203A: 155,
		0x0153: 156,
		0x017E: 158,
		0x0178: 159
	};

	function encodeWindows1252(str) {
		var bytes = new Uint8Array(str.length);
		for (var i = 0; i < str.length; i += 1) {
			var codePoint = str.charCodeAt(i);
			if (codePoint <= 127 || (codePoint >= 160 && codePoint <= 255)) {
				bytes[i] = codePoint;
				continue;
			}
			if (cp1252ExtraMap[codePoint] !== undefined) {
				bytes[i] = cp1252ExtraMap[codePoint];
				continue;
			}
			throw new UnsupportedConversionError("windows-1252로 표현할 수 없는 문자가 있습니다.");
		}
		return bytes;
	}

	function getLegacyCacheKey(encoding) {
		return encoding === "cp932" ? "shift-jis" : encoding;
	}

	function tryStoreDecodedChar(charToBytesMap, decoder, byteArray) {
		var decoded;
		try {
			decoded = decoder.decode(byteArray);
		} catch (error) {
			return;
		}
		if (decoded.length !== 1 || decoded.charCodeAt(0) === 0xFFFD) {
			return;
		}
		if (charToBytesMap[decoded] === undefined) {
			charToBytesMap[decoded] = byteArray;
		}
	}

	function buildLegacyEncoderMap(encoding) {
		var cacheKey = getLegacyCacheKey(encoding);
		if (reverseEncoderCache[cacheKey]) {
			return reverseEncoderCache[cacheKey];
		}

		var decoderName = decoderEncodingMap[encoding];
		var byteRange = legacyEncodingByteRanges[encoding];
		if (!decoderName || !byteRange) {
			throw new UnsupportedConversionError("로컬에서 지원하지 않는 입력 인코딩입니다: " + encoding, { retryable: true });
		}

		var decoder;
		try {
			decoder = new TextDecoder(decoderName, { fatal: true });
		} catch (error) {
			throw new UnsupportedConversionError("브라우저가 해당 인코딩(" + encoding + ")을 지원하지 않습니다.", { retryable: true });
		}

		var charToBytesMap = Object.create(null);
		var singleByte = 0;
		for (singleByte = 0; singleByte <= 255; singleByte += 1) {
			tryStoreDecodedChar(charToBytesMap, decoder, new Uint8Array([singleByte]));
		}

		var leadRangeIndex;
		var trailRangeIndex;
		var leadByte;
		var trailByte;
		for (leadRangeIndex = 0; leadRangeIndex < byteRange.leadRanges.length; leadRangeIndex += 1) {
			var leadRange = byteRange.leadRanges[leadRangeIndex];
			for (leadByte = leadRange[0]; leadByte <= leadRange[1]; leadByte += 1) {
				for (trailRangeIndex = 0; trailRangeIndex < byteRange.trailRanges.length; trailRangeIndex += 1) {
					var trailRange = byteRange.trailRanges[trailRangeIndex];
					for (trailByte = trailRange[0]; trailByte <= trailRange[1]; trailByte += 1) {
						tryStoreDecodedChar(charToBytesMap, decoder, new Uint8Array([leadByte, trailByte]));
					}
				}
			}
		}

		reverseEncoderCache[cacheKey] = charToBytesMap;
		return charToBytesMap;
	}

	function encodeLegacyText(text, encoding) {
		var source = text || "";
		var charToBytesMap = buildLegacyEncoderMap(encoding);
		var bytes = [];
		var i = 0;
		while (i < source.length) {
			var char = source.charAt(i);
			var firstCode = source.charCodeAt(i);
			if (firstCode >= 0xD800 && firstCode <= 0xDBFF && i + 1 < source.length) {
				var secondCode = source.charCodeAt(i + 1);
				if (secondCode >= 0xDC00 && secondCode <= 0xDFFF) {
					char = source.substring(i, i + 2);
					i += 2;
				} else {
					i += 1;
				}
			} else {
				i += 1;
			}
			var mapped = charToBytesMap[char];
			if (!mapped) {
				throw new UnsupportedConversionError("\"" + char + "\" 문자는 " + encoding + "로 표현할 수 없습니다.");
			}
			for (var j = 0; j < mapped.length; j += 1) {
				bytes.push(mapped[j]);
			}
		}
		return new Uint8Array(bytes);
	}

	function decodeBytes(bytes, encoding) {
		var decoderName = decoderEncodingMap[encoding];
		if (!decoderName) {
			throw new UnsupportedConversionError("지원하지 않는 출력 인코딩입니다: " + encoding);
		}
		try {
			return new TextDecoder(decoderName).decode(bytes);
		} catch (error) {
			throw new UnsupportedConversionError("브라우저가 해당 인코딩(" + encoding + ")을 지원하지 않습니다.", { retryable: true });
		}
	}

	function encodeTextToBytes(text, encoding) {
		if (encoding === "utf-8") {
			return new TextEncoder().encode(text);
		}
		if (encoding === "utf-16le") {
			return encodeUtf16(text, true);
		}
		if (encoding === "utf-16be") {
			return encodeUtf16(text, false);
		}
		if (encoding === "windows-1252") {
			return encodeWindows1252(text);
		}
		if (legacyEncodingByteRanges[encoding]) {
			return encodeLegacyText(text, encoding);
		}
		throw new UnsupportedConversionError("로컬에서 지원하지 않는 입력 인코딩입니다: " + encoding, { retryable: true });
	}

	async function maybeGunzip(bytes) {
		if (typeof DecompressionStream === "undefined") {
			throw new UnsupportedConversionError("이 브라우저는 GZip 해제를 지원하지 않습니다.", { retryable: true });
		}
		var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
		var buffer = await new Response(stream).arrayBuffer();
		return new Uint8Array(buffer);
	}

	async function maybeGzip(bytes) {
		if (typeof CompressionStream === "undefined") {
			throw new UnsupportedConversionError("이 브라우저는 GZip 압축을 지원하지 않습니다.", { retryable: true });
		}
		var stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"));
		var buffer = await new Response(stream).arrayBuffer();
		return new Uint8Array(buffer);
	}

	async function decodeInputToBytes(value, source) {
		if (source === "base64") {
			return base64ToBytes(value);
		}
		if (source === "gzipbase64") {
			return maybeGunzip(base64ToBytes(value));
		}
		if (source === "basehangul") {
			return baseHangulToBytes(value);
		}
		if (source === "gzipbasehangul") {
			return maybeGunzip(baseHangulToBytes(value));
		}
		if (source === "quoted-printable") {
			return quotedPrintableToBytes(value);
		}
		if (source === "unicode" || source === "monitable") {
			return null;
		}
		return encodeTextToBytes(value, source);
	}

	async function encodeBytesToOutput(bytes, target) {
		if (target === "base64") {
			return bytesToBase64(bytes);
		}
		if (target === "gzipbase64") {
			return bytesToBase64(await maybeGzip(bytes));
		}
		if (target === "basehangul") {
			return bytesToBaseHangul(bytes);
		}
		if (target === "gzipbasehangul") {
			return bytesToBaseHangul(await maybeGzip(bytes));
		}
		if (target === "quoted-printable") {
			return bytesToQuotedPrintable(bytes);
		}
		if (target === "unicode") {
			return toUnicodeEscapes(decodeBytes(bytes, "utf-8"));
		}
		if (target === "mwtable") {
			throw new UnsupportedConversionError("mwtable 출력은 모니위키 표 입력에서만 지원됩니다.");
		}
		return decodeBytes(bytes, target);
	}

	function convertMoniWikiTableToMediaWiki(input) {
		var text = input || "";
		var styleRegG = /<([^>]+)>/g;
		var styleReg = /<([^>]+)>/;
		var htmlAttrToCss = { "bgcolor": "background-color", "width": "width", "color": "color" };
		var tableAlignCount = { "left": 0, "center": 0, "right": 0 };
		var tableAlign = "left";
		var tableStyle = [];
		var tbody = text.split("\n");
		var tableArr = [];
		var i;
		var j;
		var k;
		var l;

		for (i = 0; i < tbody.length; i += 1) {
			var row = tbody[i];
			var trimmed = row.length >= 4 ? row.substring(2, row.length - 2) : "";
			var cells = trimmed.split("||");
			tableArr[i] = [];

			if (cells.length < 1) {
				continue;
			}

			for (j = 0; j < cells.length; j += 1) {
				tableArr[i][j] = [];
				var wtext = cells[j];
				var style;
				var htag;
				var attrs;
				var match;

				if (i === 0 && j === 0) {
					match = wtext.match(/<table([^>]+)>/);
					if (match) {
						wtext = wtext.replace(/<table([^>]+)>/, "");
						var wheadTop = "<" + match[1].replace(/(?:^\s|\s$)/, "") + ">";
						style = wheadTop.match(styleRegG);
						if (style) {
							for (k = 0; k < style.length; k += 1) {
								htag = style[k].match(styleReg);
								if (!htag) {
									continue;
								}
								attrs = htag[1].match(/[a-zA-Z]+\s?=\s?(?:[^'\"]+|'[^']+'|\"[^\"]+\")/g);
								if (!attrs) {
									continue;
								}
								for (l = 0; l < attrs.length; l += 1) {
									var styleAttr = attrs[l].match(/([a-zA-Z]+)\s?=\s?(?:(\"[^\"]+\"|'[^']+')|(.+))/);
									if (!styleAttr) {
										continue;
									}
									tableStyle[styleAttr[1]] = styleAttr[2] ? styleAttr[2].substring(1, styleAttr[2].length - 1) : styleAttr[3];
								}
							}
						}
					}
				}

				var headUntil = wtext.indexOf("> ");
				var whead = headUntil >= 0 ? wtext.substr(0, headUntil + 1) : "";
				if (whead) {
					style = whead.match(styleRegG);
					if (style) {
						for (k = 0; k < style.length; k += 1) {
							htag = style[k].match(styleReg);
							if (!htag) {
								continue;
							}
							attrs = htag[1].match(/[a-zA-Z]+\s?=\s?(?:[^'\"]+|'[^']+'|\"[^\"]+\")/g);
							if (attrs) {
								for (l = 0; l < attrs.length; l += 1) {
									var attr = attrs[l].match(/([a-zA-Z]+)\s?=\s?(?:(\"[^\"]+\"|'[^']+')|(.+))/);
									if (!attr) {
										continue;
									}
									tableArr[i][j][attr[1]] = attr[2] ? attr[2].substring(1, attr[2].length - 1) : attr[3];
								}
							} else {
								var color = htag[1].match(/\#[0-9a-fA-F]{3,6}/);
								if (color) {
									tableArr[i][j].color = color[0];
								}
							}
						}
					}
				}

				var rowspan = wtext.match(/<\|([0-9]+)>/);
				var colspan = wtext.match(/<\-([0-9]+)>/);
				if (rowspan) {
					tableArr[i][j].rowspan = rowspan[1];
				} else if (colspan) {
					tableArr[i][j].colspan = colspan[1];
				}

				if (headUntil >= 0) {
					wtext = wtext.substring(0, headUntil + 1).replace(styleRegG, "") + wtext.substring(headUntil + 1);
				}

				if (!tableArr[i][j].align) {
					if (wtext.substr(0, 1) !== " ") {
						tableArr[i][j].align = "left";
					} else if (wtext.substr(wtext.length - 1) !== " ") {
						tableArr[i][j].align = "right";
					} else {
						tableArr[i][j].align = "center";
					}
				}

				wtext = wtext.replace(/(^\s+|\s+$)/g, "");
				wtext = wtext.replace(/\[\[br\]\]/g, "<br/>");
				wtext = wtext.replace(/\[\[HTML\((.*?)\)\]\]/g, "$1");
				wtext = wtext.replace(/\[{1,2}wiki\:\"([^\"]+)\"\s?([^\]]+)\]{1,2}/g, "[[$1|$2]]");
				wtext = wtext.replace(/(^|[^\[])\[([^\*][^\]]+)\]($|[^\]])/g, "$1[[$2]]$3");

				tableArr[i][j].wtext = wtext;
				tableAlignCount[tableArr[i][j].align] += 1;
			}
		}

		var max = tableAlignCount.left;
		if (tableAlignCount.center > max) {
			max = tableAlignCount.center;
			tableAlign = "center";
		}
		if (tableAlignCount.right > max) {
			tableAlign = "right";
		}

		var result = "<!-- 뷁어번역기로 변환한 표입니다. -->\n";
		var tableCss = "";
		for (var key in tableStyle) {
			if (Object.prototype.hasOwnProperty.call(tableStyle, key) && htmlAttrToCss[key]) {
				tableCss += " " + htmlAttrToCss[key] + ": " + tableStyle[key] + ";";
			}
		}
		result += "{| class=\"wikitable\" style=\"text-align: " + tableAlign + "; " + tableCss + "\"\n";
		for (i = 0; i < tableArr.length; i += 1) {
			if (!tableArr[i]) {
				continue;
			}
			var splitter = i === 0 ? "!" : "|";
			result += splitter;
			for (j = 0; j < tableArr[i].length; j += 1) {
				var cell = tableArr[i][j];
				var tdHead = (cell.rowspan ? " rowspan=\"" + cell.rowspan + "\"" : "") + (cell.colspan ? " colspan=\"" + cell.colspan + "\"" : "");
				var tdCss = cell.align !== tableAlign ? " text-align: " + cell.align + ";" : "";
				for (key in cell) {
					if (Object.prototype.hasOwnProperty.call(cell, key) && htmlAttrToCss[key]) {
						tdCss += " " + htmlAttrToCss[key] + ": " + cell[key] + ";";
					}
				}
				tdHead += tdCss ? " style=\"" + tdCss.replace(/^\s+/g, "") + "\"" : "";
				result += (tdHead ? tdHead + " |" : "") + " " + cell.wtext + " " + splitter + splitter;
			}
			result = result.substr(0, result.length - 3);
			result += "\n|-\n";
		}
		result = result.substr(0, result.length - 3);
		result += "|}";
		return result;
	}

	async function convertLocally(value, source, target) {
		if (source === "unicode") {
			return decodeUnicodeEscapes(value);
		}
		if (source === "monitable") {
			return convertMoniWikiTableToMediaWiki(value);
		}
		var bytes = await decodeInputToBytes(value, source);
		if (bytes === null) {
			throw new UnsupportedConversionError("지원되지 않는 입력 형식입니다.");
		}
		return encodeBytesToOutput(bytes, target);
	}

	async function requestServerFallback(rawValue, source, target, sourceUrl, targetUrl) {
		var params = new URLSearchParams();
		params.set("q", rawValue);
		params.set("e", source);
		params.set("t", target);
		params.set("u", sourceUrl ? "1" : "0");
		params.set("r", targetUrl ? "1" : "0");

		var response = await fetch("./", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"X-Requested-With": "XMLHttpRequest"
			},
			body: params.toString(),
			credentials: "same-origin"
		});
		if (!response.ok) {
			throw new Error("서버 변환 요청이 실패했습니다. (HTTP " + response.status + ")");
		}
		return response.text();
	}

	function onSourceEncodingChanged() {
		var forcedTarget = forcedTargetBySource[sourceEncoding.value];
		if (forcedTarget) {
			targetEncoding.value = forcedTarget;
			targetEncoding.disabled = true;
		} else {
			targetEncoding.disabled = false;
		}
		sendReq();
	}

	async function sendReq() {
		var token = ++runToken;
		var rawValue = sourceTextarea.value;
		if (!rawValue) {
			targetTextarea.value = "";
			setStatus("");
			return;
		}

		var source = sourceEncoding.value;
		var target = targetEncoding.value;
		var sourceUrl = sourceUrlCheckbox.checked;
		var targetUrl = targetUrlCheckbox.checked;

		try {
			setStatus("변환 중...");
			var input = normalizeInput(rawValue, sourceUrl);
			var result;

			try {
				result = await convertLocally(input, source, target);
				result = normalizeOutput(result, targetUrl);
			} catch (error) {
				if (!(error instanceof UnsupportedConversionError) || !error.retryable) {
					throw error;
				}
				result = await requestServerFallback(rawValue, source, target, sourceUrl, targetUrl);
			}

			if (token !== runToken) {
				return;
			}
			targetTextarea.value = result;
			setStatus("완료");
		} catch (error) {
			if (token !== runToken) {
				return;
			}
			targetTextarea.value = "";
			setStatus(error.message || "변환 중 오류가 발생했습니다.", true);
		}
	}

	function installCopyHandler() {
		if (!copyButton) {
			return;
		}
		copyButton.addEventListener("click", async function () {
			if (!targetTextarea.value) {
				setStatus("복사할 결과가 없습니다.", true);
				return;
			}
			try {
				await navigator.clipboard.writeText(targetTextarea.value);
				setStatus("결과를 클립보드에 복사했습니다.");
			} catch (error) {
				targetTextarea.select();
				document.execCommand("copy");
				setStatus("결과를 클립보드에 복사했습니다.");
			}
		});
	}

	function installKeyboardConverter() {
		if (!keyboardSourceTextarea || !keyboardTargetTextarea) {
			return;
		}

		function updateKeyboardResult() {
			keyboardTargetTextarea.value = convertKeyboardToHangul(keyboardSourceTextarea.value || "");
		}

		keyboardSourceTextarea.addEventListener("input", updateKeyboardResult);
		keyboardSourceTextarea.addEventListener("change", updateKeyboardResult);
		updateKeyboardResult();

		if (!keyboardCopyButton) {
			return;
		}

		keyboardCopyButton.addEventListener("click", async function () {
			if (!keyboardTargetTextarea.value) {
				setStatus("복사할 영타 변환 결과가 없습니다.", true);
				return;
			}
			try {
				await navigator.clipboard.writeText(keyboardTargetTextarea.value);
				setStatus("영타 변환 결과를 클립보드에 복사했습니다.");
			} catch (error) {
				keyboardTargetTextarea.select();
				document.execCommand("copy");
				setStatus("영타 변환 결과를 클립보드에 복사했습니다.");
			}
		});
	}

	sourceTextarea.addEventListener("input", sendReq);
	sourceTextarea.addEventListener("change", sendReq);
	sourceEncoding.addEventListener("change", onSourceEncodingChanged);
	targetEncoding.addEventListener("change", sendReq);
	sourceUrlCheckbox.addEventListener("change", sendReq);
	targetUrlCheckbox.addEventListener("change", sendReq);
	installCopyHandler();
	installKeyboardConverter();
	onSourceEncodingChanged();
})();
