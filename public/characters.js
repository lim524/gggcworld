/* Every playable-character asset set requires a 32-frame idle + alpha portrait.
 * Asset availability does not grant account ownership or change faction. */
(function(root){
 'use strict';
 const all=[{
  id:'rin',name:'린',title:'첫걸음의 탐험가',role:'starter-candidate',status:'asset-preview',
  description:'아직 정해진 목적지는 없지만, 처음 보는 길을 그냥 지나치지 못하는 여행자. 작은 나침반과 낡은 가방을 챙겨 자신의 첫 지도를 그리기 시작합니다.',
  quote:'어느 길로 가볼까? 첫걸음은 같이 내딛자.',
  appearance:['밤색 단발과 작은 땋은 머리','짙은 청록 리본','아이보리 망토와 남색 튜닉','나침반 장식과 갈색 여행 가방'],
  portrait:{src:'assets/characters/rin/portrait-v1.webp',width:1024,height:1536,transparent:true,alt:'밤색 단발에 아이보리 망토와 갈색 여행 가방을 착용한 모험가 린의 투명 배경 상반신 일러스트'},
  animations:{idle:{src:'assets/characters/rin/idle-v1.png',manifest:'assets/characters/rin/idle-v1.json',frameCount:32,columns:4,rows:8,tileWidth:192,tileHeight:224,anchor:{x:96,y:210},frameDuration:80}},
  rigSource:'assets/characters/rin/master-v1.webp'
 }];
 function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
 const standard=freeze({idleFrames:32,tileWidth:192,tileHeight:224,columns:4,rows:8,anchor:{x:96,y:210},portraitTransparent:true});
 for(const character of all){const idle=character.animations?.idle;
  if(!idle||idle.frameCount!==32||idle.columns!==4||idle.rows!==8||idle.tileWidth!==192||idle.tileHeight!==224||idle.anchor?.x!==96||idle.anchor?.y!==210||!character.portrait?.transparent)throw Error('Character asset standard mismatch: '+character.id);
 }
 freeze(all);root.GGGCCharacters=Object.freeze({all,standard,get:id=>all.find(c=>c.id===id)||null});
})(globalThis);
