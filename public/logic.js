/**
* author: ykc
*/

'use strict';

//TODO:グローバル変数使いたくないが、配列のsetter,getterどうやって実装するのか
var cards = [];
var producedcard = [];
var deckplayer1 = [];
var deckplayer2 = [];
var tehudaplayer1 = [];
var tehudaplayer2 = [];
//グローバルとしてnewしたらグローバル変数使うのとあまり変わらないかも...
//せめてstaticにして1回しか呼び出せないようにするか、各functionでnewした時に変数が初期化されないようにしたい
var tehudasettergetter = new tehudaSetterGetter();

/**
* ルールを表示する
*/
$(document).on('click', '#showRule', function() {
  $('#showRule').on('click', function() {
    $('#overlay, #modalWindow').fadeIn();
  });

  $('#hideRule').on('click', function() {
    $('#overlay, #modalWindow').fadeOut();
  });

  locateCenter();
  $(window).resize(locateCenter);

  function locateCenter() {
    let w = $(window).width();
    let h = $(window).height();

    let cw = $('#modalWindow').outerWidth();
    let ch = $('#modalWindow').outerHeight();

    $('#modalWindow').css({
      'left': ((w - cw) / 2) + 'px',
      'top': ((h - ch) / 2) + 'px'
    });
  }
});

/**
* ゲーム開始ボタンクリック時に開始準備を行う
*/
//memo:ボタンクリック時の処理の書き方もっといいのあるはず
$(document).on('click', '#gameStart', function() {
  initClear();
  prepareCard();
  shuffleCards();
  distributeCard();
  hideTehudaPlayer2();
  placeFieldCard();
  distributeTehuda();
  cardColorRender();
  hideGameStartBtn();
});

/**
* Player1のターン開始ボタンクリック時の処理
*/
$(document).on('click', '#button_player1', function() {
  var tehudamaisu = "";
  var tehuda_player1 = "#tehuda1-";

  //player2の手札は非表示にしてplayer1を表示する
  hideTehudaPlayer2();
  showTehudaPlayer1();

  //デッキから手札に1枚引いて、デッキからカード削除
  draw(tehudaplayer1, deckplayer1[0]);
  deleteDeck(deckplayer1, 0, 1);

  //手札に引いたカードをフィールドに表示する為にidを組み立ててappend
  tehudamaisu = tehudaplayer1.length;

  //手札が空が途中にあった場合そこに次の数字を詰める
  for(var i = 1; i < tehudamaisu; i++) {
    if($(tehuda_player1 + i).text() === '') {
      for(i; i < tehudamaisu; i++) {
        $(tehuda_player1 + i).text(tehudaplayer1[i-1]);
        $(tehuda_player1 + i+1).text('');
      }
    }
  }

  tehuda_player1 = tehuda_player1 + tehudamaisu;
  $(tehuda_player1).text(tehudaplayer1[tehudamaisu-1]);

  //色つける(イマイチ)
  cardColorRender();

  //memo:なぜかクラス追加でボタンが消せない。。。ので直接cssを編集
  //$('#button_player1').addClass('hide');
  hidePlayer1TurnStartBtn();
  showPlayer2TurnStartBtn();

  //デッキがなくなったらパスボタンを表示する
  if(deckplayer1.length === 0) {
    showPlayer1PassBtn();
  }
});

/**
* Player2のターン開始ボタンクリック時の処理
*/
$(document).on('click', '#button_player2', function() {
  var tehudamaisu = "";
  var tehuda_player2 = "#tehuda2-";

  //player1の手札は非表示にしてplayer2を表示する
  hideTehudaPlayer1();
  showTehudaPlayer2();

  draw(tehudaplayer2, deckplayer2[0]);
  deleteDeck(deckplayer2, 0, 1);

  tehudamaisu = tehudaplayer2.length;

  //手札が空が途中にあった場合そこに次の数字を詰める
  for(var i = 1; i < tehudamaisu; i++) {
    if($(tehuda_player2 + i).text() === '') {
      for(i; i < tehudamaisu; i++) {
        $(tehuda_player2 + i).text(tehudaplayer2[i-1]);
        $(tehuda_player2 + i+1).text('');
      }
    }
  }

  tehuda_player2 = tehuda_player2 + tehudamaisu;
  $(tehuda_player2).text(tehudaplayer2[tehudamaisu-1]);

  //色つける(イマイチ)
  cardColorRender();

  showPlayer1TurnStartBtn();
  hidePlayer2TurnStartBtn();

  //デッキがなくなったらパスボタンを表示する
  if(deckplayer2.length === 0) {
    showPlayer2PassBtn();
  }
});

/**
* パスボタンをクリックした際にフラグ立てる
*/
$(document).on('click', '#pass_player1', function() {
  hideTehudaPlayer1();
  showTehudaPlayer2();
  tehudasettergetter.setPassPlayer1Flg(true);
  //ゲーム終了判定
  judgeGameEnd();
});

/**
* パスボタンをクリックした際にフラグ立てる
*/
$(document).on('click', '#pass_player2', function() {
  hideTehudaPlayer2();
  showTehudaPlayer1();
  tehudasettergetter.setPassPlayer2Flg(true);
  judgeGameEnd();
});


//player1,2共にパスボタンを押したらゲーム終了
function judgeGameEnd() {
  if(tehudasettergetter.getPassPlayer1Flg() && tehudasettergetter.getPassPlayer2Flg()) {
    //勝敗判定を行う
    judgeWinner();
  }
}

/**
* 勝敗判定を行う
* フィールドにあるカードを集計して、カードが多く残っている方が勝ち
*/
function judgeWinner() {
  //'♥''♦'と'♠''♣'ごとにフィールドのカードをカウントしてそれぞれ配列に格納する。
  var fieldcardall = [];
  var fieldcardplayer1 = [];
  var fieldcardplayer2 = [];

  //fieldのカードを全て配列に格納する
  $('#field td').each(function() {
    fieldcardall.push($(this).text());
  });

  //'♥''♦'と'♠''♣'ごとにフィールドのカードを格納する。
  for(var i = 0; i < fieldcardall.length; i++) {
    if(getCardMark(fieldcardall[i]) === '♠' || getCardMark(fieldcardall[i]) === '♣') {
      fieldcardplayer1.push(fieldcardall[i]);
    }
    else if(getCardMark(fieldcardall[i]) === '♥' || getCardMark(fieldcardall[i]) === '♦') {
      fieldcardplayer2.push(fieldcardall[i]);
    }
  }

  //それぞれの要素数をカウントして、多い方が勝利!
  //TODO:定数クラスを用意して呼び出すようにする。
  if(fieldcardplayer1.length < fieldcardplayer2.length) {
    alert(fieldcardplayer1.length + '対' + fieldcardplayer2.length + 'でplayer2の勝利です!');
  }
  else if(fieldcardplayer2.length < fieldcardplayer1.length) {
    alert(fieldcardplayer1.length + '対' + fieldcardplayer2.length +　'でplayer1の勝利です!');
  }
  else if(fieldcardplayer2.length === fieldcardplayer1.length) {
    alert(fieldcardplayer1.length + '対' + fieldcardplayer2.length + 'で引き分けです!');
  }

  showGameStartBtn();
}

/**
*Player1の手札クリック時の処理
*/
$(document).on('click', '#tehuda1 td', function() {
  tehudasettergetter.setSelectedtehudaidplayer1($(this).attr('id'));
  tehudasettergetter.setSelectedtehudaplayer1($(this).text());
});

/**
*Player2の手札クリック時の処理
*/
$(document).on('click', '#tehuda2 td', function() {
  tehudasettergetter.setSelectedtehudaidplayer2($(this).attr('id'));
  tehudasettergetter.setSelectedtehudaplayer2($(this).text());
});

/**
* フィールドクリック時の処理
*/
$(document).on('click', '#field td', function() {
  if(tehudasettergetter.getSelectedtehudaplayer1()) {
    var player1_selectedfieldid = $(this).attr('id');
    var player1_selectedfield = $(this).text();

    //カードの変換を行う
    var henkannumber = selectedCardNumberHenkan(tehudasettergetter.getSelectedtehudaplayer1());

    //選択した場所にカードを置けるか判定
    var flgcanPutCardOnField = canPutCardOnField(player1_selectedfieldid, henkannumber, 'player1');

    if(flgcanPutCardOnField) {
      //フィールにカードをおく
      $('#' + player1_selectedfieldid).append(tehudasettergetter.getSelectedtehudaplayer1());

      //実際の手札からも削除
      $('#' + tehudasettergetter.getSelectedtehudaidplayer1()).text("");

      //配列をループして値を照合して要素を削除
      for(var i = 0; i < tehudaplayer1.length; i++) {
        if(tehudaplayer1[i] === tehudasettergetter.getSelectedtehudaplayer1()) {
          //spliceで要素を削除
          tehudaplayer1.splice(i, 1);
        }
      }
      //色つける(イマイチ)
      cardColorRender();

      //選択した手札削除
      tehudasettergetter.setSelectedtehudaplayer1('');

      //パスフラグをfalseにする
      tehudasettergetter.setPassPlayer1Flg(false);

    }
    else {
      alert('そこには置けません');
      //選択した手札削除
      tehudasettergetter.setSelectedtehudaplayer1('');
    }
  }
  else if(tehudasettergetter.getSelectedtehudaplayer2()) {
    //TODO:上記の全く同じ処理がここにくることになる。。。ダブルメンテなんとかしたい。。。
    var player2_selectedfieldid = $(this).attr('id');
    var player2_selectedfield = $(this).text();

    var henkannumber = selectedCardNumberHenkan(tehudasettergetter.getSelectedtehudaplayer2());

    var flgcanPutCardOnField = canPutCardOnField(player2_selectedfieldid, henkannumber, 'player2');

    if(flgcanPutCardOnField) {
      $('#' + player2_selectedfieldid).append(tehudasettergetter.getSelectedtehudaplayer2());
      $('#' + tehudasettergetter.getSelectedtehudaidplayer2()).text("");

      for(var i = 0; i < tehudaplayer2.length; i++) {
        if(tehudaplayer2[i] === tehudasettergetter.getSelectedtehudaplayer2()) {
          tehudaplayer2.splice(i, 1);
        }
      }
      cardColorRender();
      tehudasettergetter.setSelectedtehudaplayer2('');
      tehudasettergetter.setPassPlayer2Flg(false);
    }
    else {
      alert('そこには置けません');
      tehudasettergetter.setSelectedtehudaplayer2('');
    }
  }
});

/**
* フィールドにカードを置けるか判定する前にカードの数字変換を行う
*/
function selectedCardNumberHenkan(card) {
    //ジョーカー以外のカードは1ー10のナンバーが割り当てられる。
    //1ー9のカードはそのカードの数字がナンバーとされる。
    //10は5、11は1、12は2、13は3のナンバーになる。
    //ジョーカーはどんなナンバーとして扱っても良いが、ジョーカー以外のカードでは取ることができない。
  var henkantaisyonumber =  "";
  var henkanafternumber = "";

  //Joker以外先頭のマークを削除する
  if(card !== 'Joker') {
     henkantaisyonumber = card.slice(1);
  }

  //Aは1,Jは11,Qは12,Kは13,10は5に変換する.1-9のカードはそのまま
  if(henkantaisyonumber === 'A' || henkantaisyonumber === 'J') {
    henkanafternumber = '1';
  }
  else if(henkantaisyonumber === 'Q') {
    henkanafternumber = '2';
  }
  else if(henkantaisyonumber === 'K') {
    henkanafternumber = '3';
  }
  else if(henkantaisyonumber === '10') {
    henkanafternumber = '5';
  }
  else if(card === 'Joker') {
    //TODO:どんなナンバーとしても扱って良い
  }
  //1-9のカードはそのまま
  else {
    henkanafternumber = henkantaisyonumber;
  }
  return henkanafternumber;
}

/**
* フィールドにカードを置くことができるか判定する
*/
function canPutCardOnField(selectedfieldid, selectedcardhenkannumber, player) {
  //カードを置けるかどうか判定する
    //1　隣接する自分のカードとのナンバーの和が10になるナンバーをもつカード
    //2　自分のカードに隣接する空きマスで空きマスに隣接する相手のカードとのナンバーの和が10になる
    //3　自分のジョーカーに隣接する空きマス（この場合置くカードのナンバーは問われない）
    //また、自陣から自分のカードで繋がっているマスに置かれている自分のカードには手札のカードから好きなカードを代わりに置くことができる。
    //このとき、置いたマスに隣接するマスに置かれた相手のカードのナンバーと新たに置いたカードのナンバーの和が10になる場合は相手のカードを取ることができる。

  //クリックしたフィールドIDを分解して配列に格納する。ex:field2-2 → [2,2]
　var deletedstrfield = selectedfieldid.replace('field', "");
  var splitfieldid = deletedstrfield.split('-');

  //上下左右のfieldの配列を生成
  var up = [Number(splitfieldid[0])-1, Number(splitfieldid[1])];
  var down = [Number(splitfieldid[0])+1, Number(splitfieldid[1])];
  var left = [Number(splitfieldid[0]), Number(splitfieldid[1])-1];
  var right = [Number(splitfieldid[0]), Number(splitfieldid[1])+1];

  //上下左右のfieldのidを生成 ex:field1-2
  var fieldidup = 'field' + up[0] + '-' + up[1];
  var fieldiddown = 'field' + down[0] + '-' + down[1];
  var fieldidleft = 'field' + left[0] + '-' + left[1];
  var fieldidright = 'field' + right[0] + '-' + right[1];

  //カードを置こうとしたfieldの上下左右のカードを取得する
  var fieldidupcard = $('#' + fieldidup).text();
  var fieldiddowncard = $('#' + fieldiddown).text();
  var fieldidleftcard = $('#' + fieldidleft).text();
  var fieldidrightcard = $('#' + fieldidright).text();

  //カードを置こうとしたfieldの上下左右のカードのマークを取得する
  var fieldupcardmark = getCardMark(fieldidupcard);
  var fielddowncardmark = getCardMark(fieldiddowncard);
  var fieldleftcardmark = getCardMark(fieldidleftcard);
  var fieldrightcardmark = getCardMark(fieldidrightcard);

  //上下左右のカードの返還後の値を取得
  var henkanafternumber_fieldidupcard = selectedCardNumberHenkan(fieldidupcard);
  var henkanafternumber_fieldiddowncard = selectedCardNumberHenkan(fieldiddowncard);
  var henkanafternumber_fieldidleftcard = selectedCardNumberHenkan(fieldidleftcard);
  var henkanafternumber_fieldidrightcard = selectedCardNumberHenkan(fieldidrightcard);

  //上下左右それぞれで和が10になったら1にしておく
  var flgup = 0;
  var flgdown = 0;
  var flgleft = 0;
  var flgright = 0;

  //最低でも1つは自分のカードと重なっていなければならない.
  //このままだと完全に自分の陣地と繋がっているかどうかの判定はできていない
  if(player === 'player1') {
    if((fieldupcardmark !== '♠' && fieldupcardmark !== '♣')
      && (fielddowncardmark !== '♠' && fielddowncardmark !== '♣')
      && (fieldleftcardmark !== '♠' && fieldleftcardmark !== '♣')
      && (fieldrightcardmark !== '♠' && fieldrightcardmark !== '♣')) {
      return false;
    }
  }
  else if(player === 'player2') {
    if((fieldupcardmark !== '♥' && fieldupcardmark !== '♦')
      && (fielddowncardmark !== '♥' && fielddowncardmark !== '♦')
      && (fieldleftcardmark !== '♥' && fieldleftcardmark !== '♦')
      && (fieldrightcardmark !== '♥' && fieldrightcardmark !== '♦')) {
      return false;
    }
  }

  //合計10となった時、それが相手のカードだったら破壊する
  //flgもonにする
  if(Number(selectedcardhenkannumber) + Number(henkanafternumber_fieldidupcard) === 10) {
    destroy(fieldidup, fieldidupcard, player);
    flgup = 1;
  }
  if(Number(selectedcardhenkannumber) + Number(henkanafternumber_fieldiddowncard) === 10) {
    destroy(fieldiddown, fieldiddowncard, player);
    flgdown = 1;
  }
  if(Number(selectedcardhenkannumber) + Number(henkanafternumber_fieldidleftcard) === 10) {
    destroy(fieldidleft, fieldidleftcard, player);
    flgleft = 1;
  }
  if(Number(selectedcardhenkannumber) + Number(henkanafternumber_fieldidrightcard) === 10) {
    destroy(fieldidright, fieldidrightcard, player);
    flgright = 1;
  }
  //最終的に1つでもflg onだったらtrueを返す
  if(flgup === 1 || flgdown === 1 || flgleft === 1 || flgright === 1) {
     return true;
  }
  else {
    return false;
  }
}

/**
* 隣接するカードと合計値が10になりかつ相手のカードだった場合、そのカードを破壊する
*/
function destroy(fieldid, fieldidcard, player) {
  var nextcardmark;

  //まずマークをとる
  if(fieldidcard !== 'Joker') {
    nextcardmark = fieldidcard.slice(0,1);
  }
  //
  if(player === 'player1') {
    if(nextcardmark === '♥' || nextcardmark === '♦') {
      //破壊
      $('#' + fieldid).text('');
    }
  }
  else if(player === 'player2') {
    if(nextcardmark === '♠' || nextcardmark === '♣') {
      //破壊
      $('#' + fieldid).text('');
    }
  }
}

/**
* カードの先頭のマークを取得する ex:♠7→♠
*/
function getCardMark(card) {
  if(card !== 'Joker') {
    var mark = card.slice(0,1);
    return mark;
  }
}

/**
*　ゲーム開始時に配列・フィールド・手札などクリア
*/
function initClear() {
  cards.length = 0;
  deckplayer1.length = 0;
  deckplayer2.length = 0;
  tehudaplayer1.length = 0;
  tehudaplayer2.length = 0;
  producedcard.length = 0;
  $('#tehuda1 td').empty();
  $('#field td').empty();
  $('#tehuda2 td').empty();
  showPlayer1TurnStartBtn();
  hidePlayer2TurnStartBtn();
}

/**
* カードを生成する
*/
function prepareCard() {
  var x = 0;
  for(var i = 1; i <= 13; i++) {
     cards[x] = new Card(0, i);
     x++;
     cards[x] = new Card(1, i);
     x++;
     cards[x] = new Card(2, i);
     x++;
     cards[x] = new Card(3, i);
     x++;
  }
}

/**
* カードをシャッフルする
*/
function shuffleCards() {
  for(var i = 0; i < 13 * 4; i++) {
      var r = Math.floor(Math.random() * 13 * 4);
      var w = cards[i];
      cards[i]=cards[r];
      cards[r]=w;
  }
}

/**
*各プレイヤーにカードを分配する
*/
function distributeCard() {
  var mark = ["♠","♣","♥","♦"];
  var number = ["","A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  var tempCard = "";

  for(var i = 0; i < 13 * 4; i++) {
    tempCard = tempCard + mark[cards[i].mark] + number[cards[i].num] + " ,";
  }
  producedcard = tempCard.split(" ,");

  //producedcardを1つずつ取り出して、♠♣と♥♦に分ける
  for(var j = 0; j < 13 * 4; j++) {
    if(producedcard[j].startsWith("♠") || producedcard[j].startsWith("♣")) {
      deckplayer1.push(producedcard[j]);
    }
    else if(producedcard[j].startsWith("♥") || producedcard[j].startsWith("♦")) {
      deckplayer2.push(producedcard[j]);
    }
  }
  //Joker分配
  //TODO:Jokerの位置が固定されてしまっている。。。
   deckplayer1.push('Joker');
   deckplayer2.push('Joker');
   console.log('デッキ');
   console.log(deckplayer1);
   console.log(deckplayer2);
}

/**
*フィールドにカードを配置する
*/
function placeFieldCard() {
  for(var i = 1; i < 3; i++) {
    for(var j = 1; j < 6; j++) {
      if(i === 1) {
        var id = "#field1-" + j;
        $(id).append(deckplayer2[j-1]);
      }
      else if(i === 2) {
        var id = "#field5-" + j;
        $(id).append(deckplayer1[j-1]);
      }
    }
  }
  //フィールドに5枚カード配置したのでデッキからカード削除
  deleteDeck(deckplayer1, 0, 5);
  deleteDeck(deckplayer2, 0, 5);
  console.log('フィールドに配置後にデッキの枚数を5枚減らす');
  console.log(deckplayer1);
  console.log(deckplayer2);
}

/**
*手札にカードを配置する
*/
function distributeTehuda() {
  //手札に5枚配布
  for(var i = 1; i < 6; i++) {
    var tehuda_player1 = "#tehuda1-" + i;
    var tehuda_player2 = "#tehuda2-" + i;
    tehudaplayer1[i-1] = deckplayer1[i-1];
    tehudaplayer2[i-1] = deckplayer2[i-1];
    $(tehuda_player1).append(tehudaplayer1[i-1]);
    $(tehuda_player2).append(tehudaplayer2[i-1]);
  }
  console.log('手札');
  console.log(tehudaplayer1);
  console.log(tehudaplayer2);
  deleteDeck(deckplayer1, 0, 5);
  deleteDeck(deckplayer2, 0, 5);
  console.log('手札配置後にデッキの枚数を5枚減らす');
  console.log(deckplayer1);
  console.log(deckplayer2);
}

/**
* トランプカードを設定するクラス
*/
function Card(mark, num) {
  this.mark= mark;
  this.num = num;
}

/**
* ターン開始時にデッキからカードを引く
* 第一引数 tehudaplayer1 or tehudaplayer2
* 第二引数 deckplayer1 or deckplayer2
*/
function draw(tehuda, deck) {
  tehuda.push(deck);
  console.log(tehudaplayer1);
  console.log(tehudaplayer2);
}

/**
* 山札削除用メソッド
* 第一引数 deckplayer1 or deckplayer2
* 第二引数 削除開始位置
* 第三引数 削除する要素数
*/
function deleteDeck(deck, start, deletekosu) {
  deck.splice(start, deletekosu);
  console.log(deckplayer1);
  console.log(deckplayer2);
}

/**
* カードに色付けする
*/
//カードのマークを取り出して、色をつけつ
function cardColorRender() {
  $('#field td, #tehuda2 td').each(function() {
    var id = $(this).attr('id');

    //一旦クラス外す
    $('#' + id).removeClass('trumpcolorred');

    //♥,♦のカードだったらスタイルクラスを追加する
    if(getCardMark($(this).text()) === '♥' || getCardMark($(this).text()) === '♦') {
      $('#' + id).addClass('trumpcolorred');
    }
  });
}

/**
* player1の手札を表示する
*/
function showTehudaPlayer1() {
  $('#tehuda1 tbody').css('visibility', 'visible');
}

/**
* player1の手札を非表示にする
*/
function hideTehudaPlayer1() {
  $('#tehuda1 tbody').css('visibility', 'hidden');
}

/**
* player2の手札を表示する
*/
function showTehudaPlayer2() {
  $('#tehuda2 tbody').css('visibility', 'visible');
}

/**
* player2の手札を非表示にする
*/
function hideTehudaPlayer2() {
  $('#tehuda2 tbody').css('visibility', 'hidden');
}

/**
* ゲーム開始ボタンを表示する
*/
function showGameStartBtn() {
  $('#gameStart').css('visibility', 'visible');
}

/**
* ゲーム開始ボタンを非表示にする
*/
function hideGameStartBtn() {
  $('#gameStart').css('visibility', 'hidden');
}

/**
* player1ターン開始ボタンを表示する
*/
function showPlayer1TurnStartBtn() {
  $('#button_player1').css('visibility', 'visible');
}

/**
* player1ターン開始ボタンを非表示にする
*/
function hidePlayer1TurnStartBtn() {
  $('#button_player1').css('visibility', 'hidden');
}

/**
* player2ターン開始ボタンを表示する
*/
function showPlayer2TurnStartBtn() {
  $('#button_player2').css('visibility', 'visible');
}

/**
* player2ターン開始ボタンを非表示にする
*/
function hidePlayer2TurnStartBtn() {
  $('#button_player2').css('visibility', 'hidden');
}

/**
* player1パスボタンを表示する
*/
function showPlayer1PassBtn() {
  $('#pass_player1').css('visibility', 'visible');
}

/**
* player1パスボタンを非表示にする
*/
function hidePlayer1PassBtn() {
  $('#pass_player1').css('visibility', 'hidden');
}

/**
* player2パスボタンを表示する
*/
function showPlayer2PassBtn() {
  $('#pass_player2').css('visibility', 'visible');
}

/**
* player2パスボタンを非表示にする
*/
function hidePlayer2PassBtn() {
  $('#pass_player2').css('visibility', 'hidden');
}

/**
* ページ読み込み時の処理
*/
$(function() {
  hidePlayer1TurnStartBtn();
  hidePlayer2TurnStartBtn();
  hidePlayer1PassBtn();
  hidePlayer2PassBtn();
  showGameStartBtn();
});

/**
* setter getter
*/
function tehudaSetterGetter() {
  var selectedtehudaidplayer1;
  var selectedtehudaidplayer2;
  var selectedtehudaplayer1;
  var selectedtehudaplayer2;
  var setpassplayer1flg;
  var setpassplayer2flg;

  this.getSelectedtehudaidplayer1 = function() {
    return selectedtehudaidplayer1;
  };
  this.setSelectedtehudaidplayer1 = function(val) {
    selectedtehudaidplayer1 = val;
  };
  this.getSelectedtehudaidplayer2 = function() {
    return selectedtehudaidplayer2;
  };
  this.setSelectedtehudaidplayer2 = function(val) {
    selectedtehudaidplayer2 = val;
  };
  this.getSelectedtehudaplayer1 = function() {
    return selectedtehudaplayer1;
  };
  this.setSelectedtehudaplayer1 = function(val) {
    selectedtehudaplayer1 = val;
  };
  this.getSelectedtehudaplayer2 = function() {
    return selectedtehudaplayer2;
  };
  this.setSelectedtehudaplayer2 = function(val) {
    selectedtehudaplayer2 = val;
  };
  this.setPassPlayer1Flg = function(val) {
    setpassplayer1flg = val;
  }
  this.getPassPlayer1Flg = function() {
    return setpassplayer1flg;
  }
  this.setPassPlayer2Flg = function(val) {
    setpassplayer2flg = val;
  }
  this.getPassPlayer2Flg = function() {
    return setpassplayer2flg;
  }
}
