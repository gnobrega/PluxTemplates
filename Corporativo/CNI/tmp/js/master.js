window.onload = function (){

    var image = new Image();
    var title = this.document.querySelector('#conteudo p');
    var video = document.getElementById('fundo');

    ebhtml.create2({}, function (loader) {

        loader.addData('D_RSS', true, 'f_tag=cni_twitter_sesi');
        loader.nodataiserror = false;
        loader.autoloaded = false;
        loader.load( function () {

            data = loader.data('D_RSS');

            title.innerHTML = data.value('texto').value.split('pic.twitter')[0];
            
            autoSizeText();

            if (data.value('foto').value != ''){
                image.src = data.value('foto').value;
                document.querySelector('#imagem').appendChild(image);
            }

            video.autoplay = true;
            
            loader.loaded();

            setTimeout(function(){
                loader.finished();
            }, 15000);     

            
        });
    });
};

var autoSizeText = function () {
    var el, elements, _i, _len, _results;
    elements = document.getElementsByClassName('resize');
    console.log(elements);
    if (elements.length < 0) {
        return;
    }
    _results = [];
    for (_i = 0, _len = elements.length; _i < _len; _i++) {
        el = elements[_i];
        _results.push((function (el) {
            var resizeText, _results1;
            resizeText = function () {
                var elNewFontSize;
                console.log('fonte size: ' + window.getComputedStyle(el).fontSize);
                elNewFontSize = (parseInt(window.getComputedStyle(el).fontSize.slice(0, -2)) - 1) + 'px';
                return el.style.fontSize = elNewFontSize;
            };
            _results1 = [];

            while (el.scrollHeight > el.offsetHeight) {
                _results1.push(resizeText());
            }
            return _results1;
        })(el));
    }
    return _results;
};

function doubleDgts(num) {
    if (num < 10) {
        return '0'+num;
    }
    return num;
}