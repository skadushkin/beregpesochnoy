(function (window, document, GPTConfig) {
    var GPT = GPT || {};

    GPTConfig.callbacksTemplate = function () {
        return {
            before: [],
            response: {
                success: [],
                error: []
            },
            ajax: {
                done: [],
                fail: [],
                always: []
            }
        }
    };

    GPT.Callbacks = {
        Chat: {
            addComment: GPTConfig.callbacksTemplate(),
            loadHistory: GPTConfig.callbacksTemplate(),
        }
    }

    GPT.Callbacks.add = function (path, name, func) {
        if (typeof func != 'function') {
            return false;
        }
        path = path.split('.');
        var obj = GPT.Callbacks;
        for (var i = 0; i < path.length; i++) {
            if (obj[path[i]] == undefined) {
                return false;
            }
            obj = obj[path[i]];
        }
        if (typeof obj != 'object') {
            obj = [obj];
        }
        if (name != undefined) {
            obj[name] = func;
        } else {
            obj.push(func);
        }
        return true;
    }

    GPT.setup = function () {
        $ = jQuery;

        this.btn;
        this.$doc = $(document);
        this.$body = this.$doc.find('body');
        this.ajaxProgress = false;
        this.response;
        this.container = '#gpt_container';

        this.sendData = {
            $form: null,
            action: null,
            formData: null
        };
    };

    GPT.load = {
        config: {},
        script: function (url, callback) {
            var script = document.createElement('script');
            if (typeof callback !== 'undefined') {
                if (script.readyState) {  //IE
                    script.onreadystatechange = function () {
                        if (script.readyState == 'loaded' || script.readyState == 'complete') {
                            script.onreadystatechange = null;
                            callback();
                        }
                    };
                } else {  //Others
                    script.onload = function () {
                        callback();
                    };
                }
            }
            script.src = url + '?v=' + GPT.Utils.uniqueid();
            document.body.appendChild(script);
        },
        style: function (url) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css'
            link.href = url + '?v=' + GPT.Utils.uniqueid();
            document.getElementsByTagName('head')[0].appendChild(link);
        },
        scripts: function () {
            this.isLoad = true;
            for (let library in this.config.scripts) {
                let libdata = this.config.scripts[library];
                if (libdata.depend && typeof window[libdata.depend] === 'undefined') continue;
                let check = typeof (libdata.depend === 'jQuery' ? jQuery.fn[library] : window[library]);
                if (check === 'undefined') {
                    this.isLoad = false;
                    if (libdata.loading !== true) {
                        libdata.loading = true;
                        if (libdata.style) this.style(libdata.style);
                        this.script(libdata.url);
                    }
                }
            }
            if (this.isLoad) {
                GPT.Initialize.config();
            } else {
                setTimeout(function () {
                    GPT.load.scripts();
                }, 50);
            }
        },
        styles: function () {
            for (let library in this.config.styles) {
                this.style(this.config.styles[library]);
            }
        },
        svg: function (url, event) {
            GPT.Loader.create();
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onload = function (e) {
                if (xhr.readyState === 4) {
                    if (xhr.status !== 200) console.error(xhr.statusText);
                    GPT.loadData = xhr.responseXML.querySelector('svg').outerHTML;
                    if (event) event();
                    GPT.Loader.destroy();
                }
            };
            xhr.onerror = function (e) {
                GPT.Message.log(xhr.statusText);
            };
            xhr.send(null);
        },
    }

    GPT.Event = {
        list: {},
        on: function (event, func) {
            this.list[event] = func;
        },
        start: function (name) {
            if (this.list[name] && typeof this.list[name] === 'function') this.list[name]();
        },
    }

    GPT.Initialize = {
        events: {},
        load: function () {
            GPT.load.scripts();
            GPT.load.styles();
        },
        config: function () {
            GPT.setup();
            var callbacks = GPTConfig.callbacksTemplate();
            callbacks.response.success = function (response) {
                if (response.data.timeout) GPT.Push.config.timeout = response.data.timeout;
                if (response.data.message) GPT.Push.config.message = response.data.message;
                if (response.data.push_type) GPT.Push.config.type = response.data.push_type;
                if (response.data.tooltips) GPT.Chat.config.tooltips = response.data.tooltips;
                GPT.Initialize.start();
            }

            GPT.Request.toSystem({
                url: document.URL,
                action: 'getConfig',
            }, callbacks);

            if (GPT.Chat.reaction) {
                for (let i in GPT.Chat.reaction) {
                    var item = GPT.Chat.reaction[i];
                    if (!item.src) continue;
                    GPT.Utils.preLoadVideo(item);
                }
            }
        },
        start: function () {
            GPT.Chat.initialize();
            GPT.Push.initialize();
        },
    }

    GPT.Chat = {
        config: {
            moduleId: 'gpt',
            limitChars: 2000,
            timeLimit: 30,
            action: '',
            // type: 'popup',
            type: 'inline',
            resize: true,
        },
        initialize: function () {
            if (this.module) return;
            this.setSession();

            if (GPTConfig.container && $(GPTConfig.container).length) {
                this.module = $(GPTConfig.container);
                this.config.type = 'inline';
                this.config.resize = false;
            } else {
                this.module = $('<div>', { id: this.config.moduleId }).appendTo(GPT.$body);
            }

            this.icon = $('<div>', { id: this.config.moduleId + '_icon' })
                .appendTo(this.module);
            $('<div>', { class: this.config.moduleId + '_icon_wrap' })
                .html(GPT.Icons.assistent)
                .on('click', function () {
                    // alert(0);
                    GPT.Chat.show();
                    // GPT.Hello.config.show ? GPT.Hello.show() : GPT.Chat.show();
                })
                .appendTo(this.icon);
            this.window = $('<div>', { id: this.config.moduleId + '_window', style: 'display: none;', 'data-type': this.config.type })
                .appendTo(this.module);

            let btns = $('<div>', { class: this.config.moduleId + '_window_buttons' })
                .appendTo(this.window);
            $('<div>', { class: this.config.moduleId + '_window_actions' })
                .html(this.config.action)
                .appendTo(this.window);
            if (this.config.resize) {
                $('<span>', { class: this.config.moduleId + '_window_resize' })
                    .html(GPT.Icons.resize)
                    .on('click', () => this.resize())
                    .appendTo(btns);
            }
            $('<span>', { class: this.config.moduleId + '_window_close' })
                .html(GPT.Icons.close)
                .on('click', (e) => this.close(e))
                .appendTo(btns);
            // this.info = $('<div>', {id: this.config.moduleId + '_info'})
            // 	.appendTo(this.window);
            this.chat = $('<div>', { id: this.config.moduleId + '_chat' })
                .appendTo(this.window);
            this.commentsWrap = $('<div>', { id: this.config.moduleId + '_comments' })
                .appendTo(this.chat);
            this.comments = $('<div>', { class: this.config.moduleId + '_comments' })
                .on('scroll', function () {
                    var $wrap = $(this).parent();
                    ($(this).scrollTop() !== 0) ? $wrap.addClass('scroll') : $wrap.removeClass('scroll');
                })
                .appendTo(this.commentsWrap);
            if (this.config.tooltips) {
                this.tplWrap = $('<div>', { id: this.config.moduleId + '_tooltips' })
                    .appendTo(this.chat);
                this.config.tooltips.forEach((t) => {
                    let p = $('<p>').html(t.text)
                        .on('click', (e) => this.addTooltip(t.text, e.target, t.file))
                        .appendTo(this.tplWrap);
                });
            }
            this.form = $('<form>', { id: this.config.moduleId + '_form' })
                .on('submit', (e) => this.submit(e))
                .appendTo(this.chat);
            this.text = $('<textarea>', { name: 'question', rows: 1 })
                .on('keydown paste cut', (e) => this.print(e))
                .on('keyup', function (e) {
                    if (e.keyCode == 13) GPT.Chat.submit(e)
                })
                .on('keyup paste cut', (e) => this.textareaRows(e))
                .appendTo(this.form);
            let buttons = $('<div>', { class: this.config.moduleId + '_form_buttons' })
                .appendTo(this.form);
            this.limit = $('<div>', { id: this.config.moduleId + '_form_limit' })
                .appendTo(buttons);
            this.setLimit();
            $('<span>', { id: this.config.moduleId + '_audio_btn' })
                .on('click', (e) => this.record(e))
                .html(GPT.Icons.sent_audio)
                .appendTo(buttons);
            $('<span>', { id: this.config.moduleId + '_msg_btn' })
                .on('click', () => this.sent())
                .html(GPT.Icons.sent_message)
                .appendTo(buttons);
            this.bodyFix();
            this.loadHistory();
            GPT.Event.start('load');
        },
        show: function () {
            // alert(1);
            if (!this.module) return;
            this.opened = true;
            // if ($(window).width() > 768) {

            //     $('#gpt').appendTo('.chat-right');
            // }

            GPT.$body.addClass(this.config.moduleId + '_chat_opened');
            this.window.show();
            this.addAssistent(this.reaction.waiting, true);
            GPT.Push.close();
            this.addAssistent(this.reaction.welcome, false, 'remove');
            if (!this.comments.html() && this.config.hello) {
                setTimeout(function () {
                    GPT.Chat.addComment(GPT.Chat.config.hello, 'text', {}, true, false);
                }, 500);
            }
        },
        close: function () {
            const videoBlock = document.getElementById('gpt_assistent');
            const video = videoBlock.querySelector('video'); // Получаем видео внутри блок
            video.pause(); // Приостанавливаем видео
            video.currentTime = 0;
            $('#gpt_assistent').find('video').remove();
            //videoBlock.removeChild(video);
            if (!this.module) return;
            GPT.$body.removeClass(this.config.moduleId + '_chat_opened');
            this.window.hide();
            $('#gpt').appendTo('body');
        },
        resize: function () {
            if (!this.module) return;
            this.window.toggleClass('full');
            this.bodyFix();
        },
        bodyFix: function () {
            let cls = this.config.moduleId + '_full';
            this.window.hasClass('full') ? GPT.$body.addClass(cls) : GPT.$body.removeClass(cls);
        },
        destroy: function () {
            this.module.remove();
            this.module = null;
        },
        update: function () {
            this.destroy();
            this.initialize();
        },
        submit: function (e) {
            e.preventDefault();
            this.sent();
        },
        print: function (e) {
            if (this.form.hasClass('block')) return e.preventDefault();
            setTimeout(function () {
                let message = GPT.Chat.text.val();
                let length = message.length;
                if (length > GPT.Chat.config.limitChars) {
                    GPT.Chat.text.val(GPT.Chat.message ?? '');
                    return;
                }
                GPT.Chat.setLimit(length);
                GPT.Chat.message = message;
            }, 0);
        },
        textareaRows: function (e) {
            let rows = 1;
            $(e.target).attr('rows', rows);
            if (e.target.clientHeight < e.target.scrollHeight) {
                rows = Math.round(e.target.scrollHeight / e.target.clientHeight);
                if (rows > 5) rows = 5;
            }
            $(e.target).attr('rows', rows);
        },
        sent: function () {
            var data = GPT.Utils.serializeFormToObject(this.form);
            if (!data.question) return;
            let comment = this.addComment(data.question);
            this.form[0].reset();
            GPT.Chat.setLimit(0);
        },
        addComment: function (message, type = 'text', properties = {}, isreply = false, sentgpt = true) {
            let actionCls = sentgpt ? 'addClass' : 'removeClass';
            this.form[actionCls]('block');
            let comment = $('<div>', { class: this.config.moduleId + '_comment' + (isreply ? ' reply' : ''), 'data-type': type })
                .html(GPT.Icons.chat_corner)
                .appendTo(this.comments);
            switch (type) {
                case 'audio':
                    let src = (typeof message === 'string') ? message : URL.createObjectURL(message);
                    let audio = $('<audio>', { src: src, controls: true }).appendTo(comment)
                        .on('ended', function () {
                            $(this).next().attr('data-action', 'play');
                            GPT.Chat.AudioReplyAssistent.remove();
                        });
                    $('<div>', { class: this.config.moduleId + '_audio_control', 'data-action': 'play' })
                        .on('click', () => this.play(audio[0]))
                        .appendTo(comment);
                    let audioLine = $('<div>', { class: this.config.moduleId + '_audio_line' }).appendTo(comment);
                    for (let i = 0; i < 40; i++) {
                        $('<span>', { style: 'height: ' + (Math.round(Math.random() * 20) + 1) + 'px' }).appendTo(audioLine);
                    }
                    $('<time>').html(GPT.Utils.parseSecToTime(properties.duration || 0)).appendTo(comment);
                    break;
                default:
                    if (!isreply) this.addAssistent(this.reaction.typing, false, 'remove');
                    comment.append(message);
                    break;
            }

            if (sentgpt) {
                var callbacks = GPTConfig.callbacksTemplate();
                callbacks.response.success = function (response) {
                    GPT.Chat.loader.remove();
                    if (response.data.messages) {
                        for (let i of response.data.messages) {
                            let comment = GPT.Chat.addComment(i.text || i.file, i.type, { duration: i.duration }, i.reply, false);
                            GPT.Chat.scroll(comment.prev());
                            if (i.action) GPT.Action.run(i.action);
                        }
                    }
                }
                callbacks.response.error = function (response) {
                    GPT.Chat.addAssistent(GPT.Chat.reaction.calling, false, 'remove');
                    window.sessionStorage.setItem('gpt_tokens_limit', 1);
                }

                var data = {
                    action: 'getGPTAnswer',
                    session_id: this.session_id,
                };

                switch (type) {
                    case 'audio':
                        let formData = new FormData();
                        formData.append('file', message, 'audio.ogg');
                        data = GPT.Request.addList(data, formData);
                        if (properties.duration) GPT.Request.add('duration', properties.duration, data);
                        break;
                    case 'tooltip':
                        GPT.Request.add('controller', 'tooltip', data);
                        if (properties.file) GPT.Request.add('file_tooltip', properties.file, data);
                    default:
                        GPT.Request.add('request', message, data);
                        break;
                }

                GPT.Request.toSystem(data, callbacks, GPT.Callbacks.Chat.addComment);

                this.loader = $('<div>', { class: this.config.moduleId + '_comment write reply' })
                    .html(GPT.Icons.chat_corner + '...')
                    .appendTo(this.comments);

                this.scroll(this.loader);
            }

            return comment;
        },
        scroll: function (el) {
            this.comments.scrollTop(this.comments.scrollTop() + el.position().top - 25);
        },
        setLimit: function (value = 0, type = 'text') {
            switch (type) {
                case 'audio':
                    this.limit.html(value);
                    break;
                default:
                    this.limit.html(value + '/' + this.config.limitChars);
                    break;
            }
        },
        initAudio: function (e) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                    this.recorder = new MediaRecorder(stream);

                    var audioChunks = [];
                    this.recorder.addEventListener('dataavailable', function (event) {
                        audioChunks.push(event.data);
                    });

                    this.recorder.addEventListener('start', function () {
                        GPT.Chat.timeStart = Date.now();
                    });

                    this.recorder.addEventListener('stop', function () {
                        GPT.Chat.finalTime = Date.now() - GPT.Chat.timeStart;
                        const audioBlob = new Blob(audioChunks, {
                            type: 'audio/ogg;codecs=opus',
                            disableWebAudio: true,
                        });
                        GPT.Chat.addComment(audioBlob, 'audio', { duration: Math.round(GPT.Chat.finalTime / 1000) });
                        audioChunks = [];
                    });

                    this.isInitAudio = true;
                    this.record(e);
                })
                .catch(function (err) {
                    console.log(err);
                });
        },
        record: function (e) {
            if (!this.isInitAudio) return this.initAudio(e);
            if (!this.recording) {
                this.start(e.currentTarget);
            } else {
                this.stop(e.currentTarget);
            }
        },
        start: function (el) {
            this.button = $(el);
            this.recording = true;
            this.button.addClass('active');
            this.recorder.start();
            this.interval = setInterval(() => this.timeline(), 1000);
        },
        stop: function (el) {
            this.recorder.stop();
            this.button.removeClass('active');
            this.recording = false;
            this.setLimit();
            clearInterval(this.interval);
        },
        play: function (audio) {
            var $control = $(audio).next();
            if (audio.paused) {
                audio.play();
                $control.attr('data-action', 'pause');
                if ($(audio).parent().hasClass('reply')) {
                    this.AudioReplyAssistent = this.addAssistent(this.reaction.talking, true);
                }
            } else {
                audio.pause();
                $control.attr('data-action', 'play');
                this.AudioReplyAssistent.remove();
            }
        },
        timeline: function () {
            if (!this.recording) return;
            let currTime = Math.round((Date.now() - this.timeStart) / 1000);
            if (this.config.timeLimit <= currTime) return this.stop();
            this.setLimit(GPT.Utils.parseSecToTime(currTime), 'audio');
        },
        loadHistory: function () {
            var callbacks = GPTConfig.callbacksTemplate();
            callbacks.response.success = function (response) {
                if (response.data.messages) {
                    for (let i of response.data.messages) {
                        GPT.Chat.addComment(i.text || i.file, i.type, { duration: i.duration }, i.reply, false);
                    }
                }
            }

            GPT.Request.toSystem({
                action: 'getChatHistory',
                session_id: this.session_id,
            }, callbacks, GPT.Callbacks.Chat.loadHistory);
        },
        setSession: function () {
            this.session_id = window.sessionStorage.getItem('session_id');
            if (!this.session_id) {
                this.session_id = GPT.Utils.uuidv4();
                window.sessionStorage.setItem('session_id', this.session_id);
            }
        },
        addAssistent: function (animation, loop = false, onPause = '') {
            if (!animation || !animation.src) return;
            if (!this.assistent) {
                var container = $('<div>', { id: this.config.moduleId + '_assistent' }).appendTo(this.window);
                this.assistent = $('<div>').appendTo(container);
            }
            var video = $('<video>', { src: animation.blob || animation.src, autoplay: true, loop: loop, playsinline: true }).appendTo(this.assistent);
            switch (onPause) {
                case 'remove':
                    video[0].addEventListener('pause', function () {
                        video.remove();
                    });
                    break;
            }
            return video;
        },
        addTooltip: function (text, el, file = null) {
            this.addComment(text, 'tooltip', { file: file });
            //  el.remove();
        },
    }

    GPT.Hello = {
        config: {
            moduleId: GPT.Chat.config.moduleId + '_hello',
            action: '',
            show: false,
        },
        initialize: function () {
            if (this.module) return;
            this.module = $('<div>', { id: this.config.moduleId })
                .appendTo(GPT.Chat.module);
            let wrapper = $('<div>', { id: this.config.moduleId + '_wrapper' })
                .on('click', function (e) {
                    if ($(e.target).attr('id') !== (GPT.Hello.config.moduleId + '_wrapper')) return;
                    GPT.Hello.close();
                })
                .appendTo(this.module);
            let window = $('<div>', { id: this.config.moduleId + '_content' })
                .appendTo(wrapper);
            if (this.config.assistent) {
                let assistent = $('<div>', { class: this.config.moduleId + '_assistent' }).appendTo(window);
                var videlem = document.createElement("video");
                videlem.src = this.config.assistent;
                videlem.loop = false;
                videlem.muted = true;
                videlem.autoplay = true;
                videlem.playsinline = true;
                assistent.append(videlem);
            }
            let column = $('<div>', { class: this.config.moduleId + '_column' })
                .appendTo(window);
            let content = $('<div>', { class: this.config.moduleId + '_content' })
                .appendTo(column);
            $('<p>', { class: this.config.moduleId + '_title' }).html(GPT.Language.get('hello_title'))
                .appendTo(content);
            $('<div>', { class: this.config.moduleId + '_speech' }).html(GPT.Language.get('hello_description') + '<span class="' + this.config.moduleId + '_speech_appendix"></span>')
                .appendTo(content);
            let actions = $('<div>', { class: this.config.moduleId + '_actions' })
                .html(this.config.action)
                .appendTo(content);
            $('<span>', { class: GPT.Chat.config.moduleId + '_btn' }).html(GPT.Language.get('hello_btn_title'))
                .on('click', function () {
                    GPT.Hello.close();
                    GPT.Chat.show();
                })
                .prependTo(actions);
            $('<span>', { class: this.config.moduleId + '_close' }).html(GPT.Icons.close)
                .on('click', () => this.close())
                .appendTo(window);
        },
        close: function () {
            const videoBlock = document.getElementById('gpt_assistent');
            const video = videoBlock.querySelector('video'); // Получаем видео внутри блок
            video.pause();
            if (!this.module) return;
            this.module.hide();
        },
        show: function () {
            if (this.module) return this.module.show();
            this.initialize();
        }
    }

    GPT.Push = {
        config: {
            cookieOpen: 'push_open',
        },
        initialize: function () {
            if (!this.config.timeout || !this.config.message) return;
            this.timeout = 0;
            this.interval = setInterval(() => this.check(), 1000);
        },
        check: function () {
            let nameCookie = this.config.cookieOpen + GPT.Utils.mathHash(location.pathname);
            if (GPT.Chat.opened || GPT.Cookie.get(nameCookie) === location.pathname) return clearInterval(this.interval);
            this.timeout++;
            if (this.timeout < this.config.timeout) return;
            this.create();
            GPT.Cookie.set(nameCookie, location.pathname, null);
            clearInterval(this.interval);
        },
        create: function () {
            console.log(this.config.type);
			switch (this.config.type) {
				case 'chat':
					GPT.Chat.addComment(this.config.message, 'text', {}, true, false);
					GPT.Chat.show();
					break;
				default:
					let id = GPT.Chat.config.moduleId + '_push';
					this.push = $('<div>', { id: id }).html(this.config.message)
						.appendTo(GPT.Chat.icon);
					$('<span>', { class: id + '_appendix' }).appendTo(this.push);
					$('<span>', { class: id + '_close' }).html(GPT.Icons.close)
						.on('click', () => this.close())
						.appendTo(this.push);
					break;
			}
        },
        close: function () {
            if (!this.push) return;
            this.push.remove();
        },
    }

    GPT.popup = {
        config: {
            popupId: 'sc_popup',
            moduleId: 'sc_popup_content',
        },
        create: function (html) {
            if (GPT.Svg.movement) return;
            this.popup = $('<div>', { id: this.config.popupId }).on('mousedown touchstart', function (e) {
                GPT.popup.close(e);
            });
            this.content = $('<div>', { id: this.config.moduleId }).appendTo(this.popup).html(html);
            $('<div>', { class: this.config.popupId + '_close' }).html('<svg xmlns="http://www.w3.org/2000/svg" version="1" viewBox="0 0 24 24"><path d="M13 12l5-5-1-1-5 5-5-5-1 1 5 5-5 5 1 1 5-5 5 5 1-1z"></path></svg>').appendTo(this.content);
            GPT.$container.append(this.popup);
        },
        close: function (e) {
            if (!this.popup) return;
            if ((e.target.id === this.config.moduleId || e.target.closest('#' + this.config.moduleId)) && (!e.target.classList.contains(this.config.popupId + '_close') && !e.target.closest('.' + this.config.popupId + '_close'))) return;
            this.popup.remove();
        },
    }

    GPT.Action = {
        list: {},
        add: function (name, act) {
            this.list[name] = act;
        },
        run: function (name) {
            var act = this.list[name];
            if (typeof act !== 'function') return;
            act();
        },
    }

    GPT.Request = {
        add: function (key, value, data) {
            if ($.isArray(data)) {
                data.push({
                    name: key,
                    value: value,
                });
            } else if ($.isPlainObject(data)) {
                data[key] = value;
            } else if (typeof data == 'string') {
                data += "&" + key + "=" + value;
            } else if (data instanceof FormData) {
                data.append(key, value);
            }
            return data;
        },
        addList: function (mix, data) {
            for (let key in mix) {
                data = this.add(key, mix[key], data);
            }
            return data;
        },
        send: function (data, config = {}, callbacks = {}, userCallbacks = {}) {
            var runCallback = function (callback, bind) {
                if (typeof callback == 'function') {
                    return callback.apply(bind, Array.prototype.slice.call(arguments, 2));
                }
                else if (typeof callback == 'object') {
                    for (var i in callback) {
                        if (callback.hasOwnProperty(i)) {
                            var response = callback[i].apply(bind, Array.prototype.slice.call(arguments, 2));
                            if (response === false) {
                                return false;
                            }
                        }
                    }
                }
                return true;
            };

            if (runCallback(callbacks.before) === false || runCallback(userCallbacks.before) === false) return;

            var XHR = ('onload' in new XMLHttpRequest()) ? XMLHttpRequest : XDomainRequest;
            let xhr = new XHR();
            xhr.responseType = 'json';
            xhr.withCredentials = true;
            xhr.open(config.method ? config.method : 'POST', config.url, true);
            if (config.headers) {
                for (let i in config.headers) {
                    xhr.setRequestHeader(i, config.headers[i]);
                }
            } else if (data instanceof FormData) {
            } else {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }
            let sendData = '';
            if ($.isArray(data) || $.isPlainObject(data)) {
                sendData = new URLSearchParams(Object.entries(data)).toString();
            } else {
                sendData = data;
            }
            xhr.send(sendData);
            xhr.onload = () => {
                if (xhr.status != 200) GPT.Message.log(`Ошибка ${xhr.status}: ${xhr.statusText}`);
                let response = GPT.response = xhr.response;
                if (response.success) {
                    if (response.message) {
                        GPT.Message.success(response.message);
                    }
                    if (response.data.update) {
                        GPT.update();
                    }
                    runCallback(callbacks.response.success, GPT, response);
                    if (!$.isEmptyObject(userCallbacks)) {
                        runCallback(userCallbacks.response.success, GPT, response)
                    };
                } else {
                    GPT.Message.log(response.message);
                    runCallback(callbacks.response.error, GPT, response);
                    if (!$.isEmptyObject(userCallbacks)) {
                        runCallback(userCallbacks.response.error, GPT, response)
                    };
                }
            };
        },
        toSystem: function (data, callbacks = {}, userCallbacks = {}) {
            if (typeof GPTConfig.user === 'undefined') return GPT.Message.log('User is undefined');
			data = GPT.Request.addList({
				user: GPTConfig.user,
				source: GPTConfig.source,
				lang: GPTConfig.lang || 'ru',
			}, data);
			let config = {
				url: GPT.url + 'data',
				type: 'POST',
				dataType: 'json',
			};
			this.send(data, config, callbacks, userCallbacks);
        },
        toOther: function (url, method = 'POST', headers = {}, data = {}, callbacks = {}) {
            let config = {
                url: url,
                type: method,
                headers: headers,
            };
            this.send(data, config, callbacks = {});
        },
    };

    GPT.Cookie = {
        get: function (name) {
            var cookie = " " + document.cookie;
            var search = " " + name + "=";
            var setStr = null;
            var offset = 0;
            var end = 0;
            if (cookie.length > 0) {
                offset = cookie.indexOf(search);
                if (offset != -1) {
                    offset += search.length;
                    end = cookie.indexOf(";", offset)
                    if (end == -1) {
                        end = cookie.length;
                    }
                    setStr = unescape(cookie.substring(offset, end));
                }
            }
            return (setStr);
        },
        set: function (name, value, expires, path, domain, secure) {
            document.cookie = qwe = name + "=" + escape(value) +
                ((expires) ? "; expires=" + expires : "") +
                ((path) ? "; path=" + path : "") +
                ((domain) ? "; domain=" + domain : "") +
                ((secure) ? "; secure" : "");
        },
    }

    GPT.Message = {
        config: {
            container: 'sc_message',
        },
        log: function (message) {
            console.error('[GPT] - ' + message);
        },
        create: function (text, type = 'success') {
            this.initialize();
            let item = $('<div>', { class: 'sc_message ' + type }).text(text).appendTo(this.contaner);
            let close = $('<div>', { class: 'sc_message_close' }).html('<svg xmlns="http://www.w3.org/2000/svg" version="1" viewBox="0 0 24 24"><path d="M13 12l5-5-1-1-5 5-5-5-1 1 5 5-5 5 1 1 5-5 5 5 1-1z"></path></svg>').appendTo(item);
            close.on('click', () => item.remove());
        },
        error: function (message) {
            this.create(message, 'error');
        },
        errRequired: function () {
            this.error('Заполните и/или выберите обязательные поля.');
        },
        initialize: function () {
            if (this.contaner) return;
            this.contaner = $('<div>', { id: this.config.container }).appendTo(GPT.$body);
            $('body').on('click', function (e) {
                //if (!$(e.target).hasClass('sc_message')) GPT.Message.contaner.html('');
            });
        },
    }

    GPT.Loader = {
        config: {
            parCls: 'sc_loading',
        },
        create: function () {
            if (this.el) return;
            this.el = $('<span>', { class: 'sc_loader' });
            GPT.$body.addClass(this.config.parCls);
            this.el.prependTo(GPT.$body);
        },
        destroy: function () {
            if (!this.el) return;
            this.el.remove();
            this.el = null;
            GPT.$body.removeClass(this.config.parCls);
        },
    };

    GPT.Utils = {
        serializeObject: function (data) {
            var obj = {};
            data.map(function (x, i) {
                obj[x.name] = x.value;
            });
            return obj;
        },
        serializeFormToObject: function (form) {
            return this.serializeObject(form.serializeArray());
        },
        serializeBlockToObject: function (block) {
            return this.serializeObject(block.find('input, select, textarea').serializeArray());
        },
        getValueByPath: function (path, data) {
            let i = path.shift();
            if (data[i] === null || typeof data[i] === 'undefined') return null;
            return path.length > 0 ? this.getValueByPath(path, data[i]) : data[i];
        },
        scroll: function (to, container) {
            to = (typeof to === 'string') ? $(to) : to;
            if (!to.length) return;
            if (!container) container = 'html, body';
            container = (typeof container === 'string') ? $(container) : container;
            let scrollHeight = to[0].offsetTop - container[0].offsetTop;
            $(container).animate({
                scrollTop: scrollHeight
            }, 500);
        },
        isMobile: function () {
            return (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ||
                (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.platform)));
        },
        lockScroll: function (lock = true) {
            let method = lock ? 'addClass' : 'removeClass';
            $('html')[method]('sc_unscroll');
        },
        uniqueid: function () {
            return Math.random().toString(36).slice(2);
        },
        uuidv4() {
            return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                .replace(/[xy]/g, function (c) {
                    const r = Math.random() * 16 | 0,
                        v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
        },
        parseSecToTime: function (second) {
            return new Date(second * 1000).toISOString().substr(15, 4);
        },
        mathHash: function hashCode(s) {
            for (var i = 0, h = 0; i < s.length; i++)
                h = Math.imul(31, h) + s.charCodeAt(i) | 0;
            return h;
        },
        preLoadVideo: function (video) {
            let req = new XMLHttpRequest();
            req.open('GET', video.src, true);
            req.responseType = 'blob';
            req.onload = function () {
                if (this.status === 200) {
                    let videoBlob = this.response;
                    video.blob = URL.createObjectURL(videoBlob);
                }
            }

            req.onerror = function () {
                console.error(`Video for ${video.url} wouldn't load.`);
            }

            req.send();
        },
    }

    GPT.Language = {
        glossary: {

        },
        get: function (name) {
            return this.glossary[name] || name;
        },
        set: function (name, value) {
            this.glossary[name] = value;
        },
        setList: function (data) {
            for (let key in data) {
                this.set(key, data[key]);
            }
        }
    }

    GPT.Icons = {
        resize: `<svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.63831 1.35144C9.68455 1.39788 9.71345 1.46174 9.71079 1.52872C9.71258 1.66982 9.60508 1.77778 9.46459 1.77598L1.65683 1.67973L1.75267 9.52142C1.75446 9.66252 1.64696 9.77048 1.50647 9.76869C1.36598 9.76689 1.25571 9.65614 1.25392 9.51504L1.14827 1.17592L9.45131 1.28204C9.52155 1.28293 9.58514 1.31196 9.62782 1.35483L9.63831 1.35144Z" stroke-miterlimit="10"/><path d="M1.95155 1.41053L9.96787 9.46168C9.98317 9.47705 9.94297 9.54158 9.8765 9.60833C9.81004 9.67509 9.74579 9.71546 9.73049 9.70009L1.71417 1.64894C1.69887 1.63357 1.73907 1.56905 1.80554 1.50229C1.872 1.43554 1.93625 1.39516 1.95155 1.41053Z" stroke-miterlimit="10"/></svg>`,
        close: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 15L1 1.00003M15 1L1.00002 15" stroke="#F4EADA" stroke-width="1.5" stroke-linecap="round"/></svg>`,
        assistent: `<video autoplay muted loop><source src="/assistent.mp4" type="video/mp4"></video>`,
        // assistent: `<video autoplay muted loop><source src="test.mp4" type="video/mp4"></video><svg viewBox="0 0 307 307" fill="none" xmlns="http://www.w3.org/2000/svg">
        // <circle cx="153.5" cy="153.5" r="153.5" fill="#777756"/><path d="M154.559 237.378C129.747 237.378 104.939 237.336 80.1273 237.44C77.5323 237.45 76.7414 236.809 76.7828 234.162C77.0619 214.964 80.5201 196.515 89.6851 179.467C97.501 164.931 108.966 154.376 124.489 148.302C128.956 146.555 133.013 146.782 137.139 148.917C138.896 149.827 140.71 150.649 142.416 151.646C144.82 153.052 147.25 154.024 149.715 154.619C155.722 156.061 161.274 154.965 166.339 153.585C174.853 151.269 175.075 149.026 179.841 148.297C187.704 147.097 194.537 152.075 200.001 156.169C214.878 167.314 222.353 181.628 225.429 190.028C230.774 204.61 232.681 219.715 232.5 235.165C232.474 237.388 231.384 237.404 229.766 237.398C204.695 237.373 179.629 237.383 154.559 237.383V237.378Z" fill="white" fill-opacity="0.9"/><path d="M156.981 68.2332C176.65 68.3314 195.466 85.1624 194.204 108.698C193.171 128.026 176.893 145.725 153.59 144.391C133.146 143.223 117.312 125.73 117.948 104.914C118.579 84.3715 136.154 67.737 156.981 68.2332Z" fill="white" fill-opacity="0.9"/></svg>`,
        sent_message: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9H15" stroke="#765E50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.75 3.75L15 9L9.75 14.25" stroke="#765E50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        sent_audio: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.5C12 2.84315 10.6569 1.5 9 1.5C7.34315 1.5 6 2.84315 6 4.5V8.25C6 9.90685 7.34315 11.25 9 11.25C10.6569 11.25 12 9.90685 12 8.25V4.5Z" stroke="#765E50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.5 12.2188C12.4006 13.4644 10.7921 14.25 9 14.25C7.20797 14.25 5.59942 13.4644 4.5 12.2188" stroke="#765E50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 14.25V16.5" stroke="#765E50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 16.5H10.5" stroke="#765E50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        chat_corner: ``
    }

    window.GPT = GPT;
})(window, document, GPTConfig);

GPT.url = "https://myf-assistant-yc.benpan.ru/";
GPT.load.config = {
    scripts: {
        jQuery: { url: '//code.jquery.com/jquery-3.7.0.min.js' },
    },
    styles: {
        0: 'https://myf-assistant-yc.benpan.ru/assets/components/gpt/css/web/gpt.css',
    },
};
GPT.Language.glossary = { "hello_title": "\u0414\u0430\u0432\u0430\u0439\u0442\u0435 \u043f\u043e\u0437\u043d\u0430\u043a\u043e\u043c\u0438\u043c\u0441\u044f", "hello_description": "\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435, \u043c\u0435\u043d\u044f \u0437\u043e\u0432\u0443\u0442 \u0410\u043b\u0435\u043a\u0441, \u044f \u043f\u043e\u043c\u043e\u0433\u0443 \u0432\u0430\u043c \u0441\u043e\u0440\u0438\u0435\u043d\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c\u0441\u044f \u043d\u0430 \u0441\u0430\u0439\u0442 \u0438\u043b\u0438 \u043e\u0442\u0432\u0435\u0447\u0443 \u043d\u0430 \u0432\u0430\u0448 \u0432\u043e\u043f\u0440\u043e\u0441", "hello_btn_title": "\u0427\u0430\u0442 \u0441 \u0410\u043b\u0435\u043a\u0441\u043e\u043c" };