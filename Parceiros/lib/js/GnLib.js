/**
 * Biblioteca utilitária para templates MarkTv
 */
var GnLib = {
    dataSource: null,
    filter:{},

    /**
     * Retorna o diretório de conteúdos
     */
    getContentPath: function () {
        var path;

        //Altera a url para o ambiente de testes
        if (window.location.href.indexOf("localhost") > -1) {
            path = "http://" + window.location.hostname + "/content";
        } else {
            path = "file:///c:/3MIDIA";
        }
        return path;
    },

    /**
     * Carrega o conteúdo em Xml
     */
    loadContent: function (dataSource, callback, file) {
        var url = GnLib.getContentPath() + dataSource + "?nocache=" + Math.random();
        this.dataSource = url;
        $.ajax({
            url: url,
            type: 'GET',
            //dataType: 'xml',
            success: function (data) {

                //Template
                var template = new GnLib.Template();
                
                //Extrai os dados dos registros
                $(data).find("module").find("item").each(function () {
                    var registro = new GnLib.Registro();
                    var attributes = $(this).get(0).attributes;
                    $.each(attributes, function () {
                        registro[this.name] = this.value;
                    });
                    $(this).children().each(function () {
                        var tag = $(this).prop("tagName");
                        registro[tag] = $(this).text();
                    });
                    template.registros.push(registro);
                });
                
                //Aplica os filtros
                template.registros = GnLib.applyFilters(template.registros);

                //Se não houver registro pula para a próxima mídia
                if (template.registros.length == 0) {
                    GnLib.dump();
                    console.log("Dump()");
                    return;
                } else { //Conteúdo encontrado
                    if (typeof (GnContentFound) != 'undefined') {
                        GnContentFound();
                    }
                }

                //Retorna os objetos
                callback(template);
            },
            error: function (jqXHR, textStatus, errorThrown) {

                //Se houver problema na requisição pula para a próxima mídia
                GnLib.dump();
                return;
            }
        });
    },

    /**
     * Preenche os campos automaticamente
     */
    autoloadContent: function (dataSource, callback) {
        GnLib.loadContent(dataSource, function (template) {
            var index = GnLib.getIndex(dataSource, template.registros);

            //Percorre os atributos do registro e preenche os campos
            var registro = template.registros[index];
            var listObjsImg = [];
            var countImgLoaded = 0;
            for (field in registro) {
                var value = registro[field];
                var objField = $("#" + field);
                if (objField.length > 0) {

                    if (objField.prop("tagName") == "IMG") {
                        if( value ) {
                            listObjsImg.push(objField);
                            var idx = GnLib.dataSource.lastIndexOf("/");
                            var src = GnLib.dataSource.substr(0, idx) + "/img_" + value + "." + registro.extId;
                            var objFieldImg
                            objField.hide();
                            objField.attr("src", src);
                            var tmpImg = new Image();
                            tmpImg.src = objField.attr('src');
                            tmpImg.onload = function () {
                                countImgLoaded++;
                                if (countImgLoaded >= listObjsImg.length) {
                                    for (i in listObjsImg) {
                                        listObjsImg[i].show();
                                    }
                                }
                            };
                        }
                    } else {
                        objField.html(value);
                    }
                }
            }
            
            //Callback
            if( callback ) {
                callback(template);
            }
        });
    },
    
    /**
     * Aplica filtros a lista de registros
     */
    applyFilters: function(registros) {
        for( attr in GnLib.filter ) {
            var tmp = [];
            for( r in registros ) {
                if( registros[r][attr] && registros[r][attr] == GnLib.filter[attr] ) {
                    tmp.push(registros[r]);
                }
            }
            registros = tmp;
        }
        return registros;
    },

    /**
     * Preenche automaticamente os campos do rodapé
     */
    autoloadFooter: function () {
        GnLib.updateTime();
        setInterval(GnLib.updateTime, 10000);
    },

    /**
     * Preenche automaticamente os campos do rodapé V.2
     */
    autoloadFooterV2: function () {
        GnLib.updateTimeV2();
        setInterval(GnLib.updateTimeV2, 10000);

        //Recarrega o rodapé por hora
        setInterval(function () {
            history.go(0)
        }, 3600000);
    },

    /**
     * Inicia a animação do template
     */
    play: function () {},

    /**
     * Autaliza o horário
     */
    updateTime: function () {
        var MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        var d = new Date();
        var horas = d.getHours();
        var minutos = d.getMinutes();
        var dia = d.getDate();
        var mes = d.getMonth();
        var ano = d.getFullYear();
        if (horas < 10) {
            horas = "0" + horas;
        }
        if (minutos < 10) {
            minutos = "0" + minutos;
        }
        if (dia < 10) {
            dia = "0" + dia;
        }
        $("#hora").html(horas + ":" + minutos);
        $("#data").html(dia + " de " + MESES[mes] + " de " + ano);

        //Verifica se o relógio está atualizado
        if (ano > 2015 && ano < 2030) {
            $("#cena2").hide();
        } else {
            $("#cena2").show();
        }
    },

    /**
     * Autaliza o horário V.2
     */
    updateTimeV2: function () {
        var DIAS = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
        var d = new Date();
        var horas = d.getHours();
        var minutos = d.getMinutes();
        var dia = d.getDate();
        var mes = d.getMonth() + 1;
        var ano = d.getFullYear();
        var diaSemana = d.getDay();
        if (horas < 10) {
            horas = "0" + horas;
        }
        if (minutos < 10) {
            minutos = "0" + minutos;
        }
        if (dia < 10) {
            dia = "0" + dia;
        }
        if (mes < 10) {
            mes = "0" + mes;
        }
        $("#hora").html(horas + ":" + minutos);
        $("#data").html(dia + "/" + mes + "/" + ano);
        $("#dia").html(DIAS[diaSemana]);

        //Verifica se o relógio está atualizado
        if (ano > 2015 && ano < 2030) {
            $("#cena2").hide();
        } else {
            //$("#cena2").show();
        }

        //Temperatura
        var pathData = GnLib.getContentPath() + "wikipix/wikipix_tempo/";
        var url = pathData + "df.xml?nocache=" + Math.random();
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'xml',
            success: function (data) {
                //Extrai os dados do tempo
                var day = $(data).find("day").eq(0);
                var hi = day.find("hi").text();
                var low = day.find("low").text();
                $("#maxima").html(hi + "º");
                $("#minima").html(low + "º");

                //Turno
                var iconKey = 0;
                if (d.getHours() >= 7 && d.getHours() <= 18) {
                    //Diurno
                    iconKey = parseInt(day.find('part').eq(0).find('icon').text());
                } else {
                    //Noturno
                    iconKey = parseInt(day.find('part').eq(1).find('icon').text()) + 4;
                }
                var icon = "nuvem";
                switch (iconKey) {
                    case 1:
                        icon = 'sol-nuvem';
                        break;
                    case 2:
                        icon = 'sol';
                        break;
                    case 3:
                        icon = 'sol-nuvem';
                        break;
                    case 4:
                        icon = 'chuva';
                        break;
                    case 5:
                        icon = 'lua-nuvem';
                        break;
                    case 6:
                        icon = 'lua';
                        break;
                    case 7:
                        icon = 'nuvem';
                        break;
                    case 8:
                        icon = 'tempestade';
                        break;
                }
                $("img#icon").attr('src', './img/' + icon + '.png')
            },
            error: function (jqXHR, textStatus, errorThrown) {
                //Se houver problema na requisição pula para a próxima mídia
                GnLib.dump();
                return;
            }
        });
    },

    /**
     * Define o índice do registro
     */
    getIndex: function (TEMPLATE_KEY, registros) {
        var key = TEMPLATE_KEY + "_idx";
        var index = localStorage.getItem(key);
        if (index == null) {
            index = 0;
        } else {
            index++;
            if (index >= registros.length) {
                index = 0;
            }
        }
        localStorage.setItem(key, index);
        return index;
    },

    /**
     * Console do template
     */
    print: function (str) {
        $("#console").html(": " + str);
    },

    /**
     * Envia um comando para o JsPlayer
     * "dump": pula para a próxima mídia
     */
    jsPlayerSend: function (command) {
        console.log("Send command JsPlayer: \"" + command + "\"");
    },

    /**
     * Pula para a próxima mídia
     */
    dump: function () {
        if (typeof (GnContentNotFound) != 'undefined') {
            GnContentNotFound();
        }
    },

    /**
     * Converte o conteúdo do arquivo .INI em objetros
     */
    parseIni: function (data) {
        var regex = {
            section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
            param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
            comment: /^\s*;.*$/
        };
        var value = {};
        var lines = data.split(/[\r\n]+/);
        var section = null;
        lines.forEach(function (line) {
            if (regex.comment.test(line)) {
                return;
            } else if (regex.param.test(line)) {
                var match = line.match(regex.param);
                if (section) {
                    value[section][match[1]] = match[2];
                } else {
                    value[match[1]] = match[2];
                }
            } else if (regex.section.test(line)) {
                var match = line.match(regex.section);
                value[match[1]] = {};
                section = match[1];
            } else if (line.length == 0 && section) {
                section = null;
            }
            ;
        });
        return value;
    },

    /**
     * Recupera um parâmetro GET
     */
    getParam: function (parameterName) {
        var result = null,
                tmp = [];
        location.search
                .substr(1)
                .split("&")
                .forEach(function (item) {
                    tmp = item.split("=");
                    if (tmp[0] === parameterName)
                        result = decodeURIComponent(tmp[1]);
                });
        return result;
    },

    /**
     * Recupera todos os parâmetros GET
     */
    getParams: function (parameterName) {
        var params = {};
        var tmp = [];
        location.search
                .substr(1)
                .split("&")
                .forEach(function (item) {
                    tmp = item.split("=");
                    params[tmp[0]] = decodeURIComponent(String(tmp[1]).replace(/\+/g, ' '));
                });
        return params;
    },

    /**
     * Carrega os dados do sistema de senhas
     */
    queueUrlServer: null,
    speaking: false,
    autoloadSystemQueue: function () {
        var configIni = GnLib.getConfigIni();
        if (typeof (configIni.queue.server) != 'undefined') {
            GnLib.queueUrlServer = configIni.queue.server;
            GnLib.getQueueNotification();
            var thisObj = this;
            setInterval(thisObj.getQueueNotification, 8000);
        }
    },

    /**
     * Recupera a próxima senha
     * Audio: https://soundoftext.com/
     */
    getQueueNotification: function () {
        var apiGetNotification = GnLib.queueUrlServer + "api.php?action=getNotification";
        var thisObj = this;
        if (GnLib.speaking) {
            return;
        }

        $.getJSON({
            url: apiGetNotification,
            type: 'GET',
            timeout: 10000,
            success: function (rs) {
                if (rs.status == 'success') {
                    if (typeof (rs.data.password) != 'undefined') {

                        //Suspende as atividades até encerrar a fala
                        GnLib.speaking = true;
                        setTimeout(function () {
                            GnLib.speaking = false;
                        }, 7000);


                        //Número da senha
                        $("#senha").html(rs.data.password);

                        //Tipo da senha
                        var audioType;
                        if (rs.data.type == 'TYPE_PRIORITY') {
                            $("#tipo").html("Preferencial");
                            audioType = "preferencial";

                            //Altera o plano de fundo
                            $("div#background").addClass("background2");
                            $("body").addClass("preferencial");
                        } else {
                            $("#tipo").html("Normal");
                            audioType = "normal";

                            //Altera o plano de fundo
                            $("div#background").removeClass("background2");
                            $("body").removeClass("preferencial");
                        }

                        //Local de atendimento
                        var audioLocal;
                        if (typeof (rs.data.clinic) != 'undefined') {
                            $("#dados").addClass("v2");
                            $("#local").html(rs.data.clinic);
                            audioLocal = rs.data.clinic;
                            if (rs.data.patient) {
                                var patient = rs.data.patient;
                                if (patient.length > 17) {
                                    patient = patient.substr(0, 17) + "...";
                                }
                                $("#senha").html(rs.data.password + "<span>" + patient + "</span>");
                            }
                        } else {
                            $("#dados").removeClass("v2");
                            $("#local").html(rs.data.attendance);
                            audioLocal = rs.data.attendance;
                        }
                        audioLocal = GnLib.removerAcentos(audioLocal);

                        //Exibe o template de senha
                        GnLib.androidSend("SHOW_QUEUE")

                        //Chama pelo áudio
                        GnLib.speakPassword(audioType, rs.data.password, audioLocal);
                    }
                } else {
                    console.log(rs.msgErro);
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(textStatus);
            }
        });
    },

    /**
     * Emite o áudio da senha
     */
    speakPassword: function (type, password, local) {
        //Tipo
        var soundType = new Sound("./media/audio/" + type + ".mp3");
        soundType.start(function () {
            var soundPass1 = new Sound("./media/audio/" + password[0] + ".mp3");
            soundPass1.start(function () {
                var soundPass2 = new Sound("./media/audio/" + password[1] + ".mp3");
                soundPass2.start(function () {
                    var soundPass3 = new Sound("./media/audio/" + password[2] + ".mp3");
                    soundPass3.start(function () {
                        var soundLocal = new Sound("./media/audio/" + local + ".mp3");
                        soundLocal.start();
                    });
                });
            });
        });
    },

    /**
     * Remove acentos de caracteres
     */
    removerAcentos: function (newStringComAcento) {
        var string = newStringComAcento;
        var mapaAcentosHex = {
            a: /[\xE0-\xE6]/g,
            e: /[\xE8-\xEB]/g,
            i: /[\xEC-\xEF]/g,
            o: /[\xF2-\xF6]/g,
            u: /[\xF9-\xFC]/g,
            c: /\xE7/g,
            n: /\xF1/g
        };

        for (var letra in mapaAcentosHex) {
            var expressaoRegular = mapaAcentosHex[letra];
            string = string.replace(expressaoRegular, letra);
        }
        string = string.replace(/\s/g, '');
        return string.toLowerCase();
    },

    /**
     * Objeto Template
     */
    Template: function () {
        this.registros = new Array();
    },

    /**
     * Objeto Registro
     */
    Registro: function () {
    }
}

/**
 * Possibilitaa execução de MP3
 */
function Sound(source)
{
    this.source = source;
    this.start = function (callback) {
        var $sound = $("#sound");
        $sound.attr("src", this.source);
        $sound.off("ended");
        $sound.on("canplay", function () {
            $sound.get(0).play();
        });
        $sound.on("ended", function () {
            if (typeof (callback) != 'undefined') {
                callback();
            }
        });
        $sound.get(0).onerror = function () {
            if (typeof (callback) != 'undefined') {
                callback();
            }
        }
    }
}