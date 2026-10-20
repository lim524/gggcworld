/* Canonical first-event facts shared by server and renderer. */
export const NOX_STONE={
 id:'nox-stone-v1',faction:'nox',regionX:0,regionY:0,x:18,y:12,
 title:'보랏빛 돌',recordTitle:'황혼 초원의 작은 빛',
 opening:'이 돌, 그냥 지나치기엔 좀 수상하지? 땅에 단단히 박혀 있고, 표면에는 읽을 수 없는 무늬가 있어. 어디 한번 같이 살펴볼까.',
 facts:['돌은 황혼 초원 시작 구역의 길가에 박혀 있다.','표면에 희미한 보랏빛과 읽을 수 없는 무늬가 있다.','지금은 돌을 가져가거나 파괴할 수 없고, 보상도 없다.'],
 choices:['이 돌은 뭐야?','표면의 무늬를 같이 살펴볼까?','여기서 무엇을 할 수 있어?']
};
export function nearNoxStone(regionX,regionY,x,y){
 return regionX===0&&regionY===0&&Number.isInteger(x)&&Number.isInteger(y)&&Math.abs(x-NOX_STONE.x)+Math.abs(y-NOX_STONE.y)===1;
}
export function blocksNoxStone(faction,regionX,regionY,x,y){
 return faction==='nox'&&regionX===0&&regionY===0&&x===NOX_STONE.x&&y===NOX_STONE.y;
}
