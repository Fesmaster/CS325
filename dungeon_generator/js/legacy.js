/* This file contians various legacy functions that I might actually bring bakc into this game. But maybe not.
 * 
 */


/*Lagacy room building
 */
function buildRoom_legacy(map, pos, size, dir){
    let vecs = getVectorFromDir(dir)
    //vecs.Right.scale(size.y/2);
    //vecs.Forward.scale(size.x);
    //get the corners
    let c1 = new Phaser.Math.Vector2(
        pos.x - vecs.Right.x*Math.ceil(size.y/2),
        pos.y - vecs.Right.y*Math.ceil(size.y/2)
    );
    let c2 = new Phaser.Math.Vector2(
        pos.x + vecs.Right.x*Math.floor(size.y/2) + vecs.Forward.x*size.x,
        pos.y + vecs.Right.y*Math.floor(size.y/2) + vecs.Forward.y*size.x,
    );
    if (vecs.Forward.x < 0){
        c1.x++;
        c2.x++;
    }
    if (vecs.Forward.y < 0){
        c1.y++;
        c2.y++;
    }
    //console.log("buildRoom:");
    //console.log(c1);
    //console.log(c2);
    for (let x = Math.min(c1.x, c2.x); x < Math.max(c1.x, c2.x);x++){
        for (let y = Math.min(c1.y, c2.y); y < Math.max(c1.y, c2.y);y++) {
            map[x][y] = 3;
        }
    }
    map[pos.x][pos.y] = 0; //draw the origin as a pillar
}
