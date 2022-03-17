const canvas_size_x = 400
const canvas_size_y = 500
const canvas_unit_x = 14
const canvas_unit_y = 18
const grid_color = 200


let pawn_p1_color, cell_p1_color;
let pawn_p2_color, cell_p2_color;
let movement_start_color, movement_end_color;

const grid_size = 7;

var cell_dimension_x, cell_dimension_y;

let cells = [];
let buttons_up = [];
let buttons_down = [];
let pawns = [];

const permutator = (inputArr) => {
    let result = [];
  
    const permute = (arr, m = []) => {
      if (arr.length === 0) {
        result.push(m)
      } else {
        for (let i = 0; i < arr.length; i++) {
          let curr = arr.slice();
          let next = curr.splice(i, 1);
          permute(curr.slice(), m.concat(next))
       }
     }
   }
  
   permute(inputArr)
  
   return result;
  }

Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}

Array.prototype.swap = function (x,y) {
    var b = this[x];
    this[x] = this[y];
    this[y] = b;
    return this;
}

function setup() {
    cell_dimension_x = canvas_size_x/canvas_unit_x;
    cell_dimension_y = canvas_size_y/canvas_unit_y;
    pawn_p1_color = color(0,0,255);
    cell_p1_color = color(166,196,245);
    pawn_p2_color = color(255,0,0);
    cell_p2_color = color(250, 153, 150);
    movement_start_color = color(240,240,111);
    movement_end_color = color(240,240,200);
    createCanvas(canvas_size_x, canvas_size_y);

    count=0
    for(let x = 0; x < grid_size*2; x+=2) {
        for(let y = 0; y < grid_size*2; y+=2) {
            cells[count] = new Cell(count,x,y+2,2,2);
            count++;
        }
    }
    
    count=0
    for(let x=0; x< grid_size*2; x+=2){
        buttons_up.push(new Button(count,x,1,2,1,col=color(252,186,3),col_hover=color(189,139,0)));
        buttons_down.push(new Button(count,x,canvas_unit_y-2,2,1,col=color(252,186,3),col_hover=color(189,139,0)));
        count++;
    }

    pawns.push(new Pawn(0,3,1,1));
    //pawns.push(new Pawn(1,1,1,1));
    pawns.push(new Pawn(6,3,1,-1));
    //pawns.push(new Pawn2(4,4,1,-1))
}

function draw(){
    background(grid_color);
    cells.forEach(c=>c.display());
    buttons_up.forEach(c=>c.display());
    buttons_down.forEach(c=>c.display());
    pawns.forEach(pawn=>pawn.display());
    pawns = pawns.filter(pawn=>!pawn.dead);
}

function mouseClicked() {
    cells.forEach(c=>c.click());
    buttons_up.forEach(b=>b.click());
    buttons_down.forEach(b=>b.click());
}

let candidateMerging = [];
function checkMerging() {
    combos = [
        [Pawn, [[1,0],[1,0]]], // horizontal raw of three: add 1 on x, then add another 1 on x
        [Pawn, [[0,1],[0,1]]]
    ]

    permutated_candidates = permutator(candidateMerging);
    combos.forEach((l)=>{
        let p = l[0]
        let combo = l[1]
        for(let i=0; i<permutated_candidates.length; i++){
            current_perm = permutated_candidates[i];
            actual_combo = []
            for(let c=1;c<current_perm.length;c++){
                diff_x = (current_perm[c].x-current_perm[c-1].x)/2;
                diff_y = (current_perm[c].y-current_perm[c-1].y)/2;
                actual_combo.push([diff_x,diff_y]);
            }
            if(actual_combo.equals(combo)){
                let cell_index = current_perm[0].x/2*grid_size+current_perm[0].y/2-1
                pawns.push(new p(current_perm[0].x/2,current_perm[0].y/2-1,1,cells[cell_index].colored));
                current_perm.forEach(c=>c.clearMerging());
            }
            
        }
    })
}

class Pawn {
    #x_px; #y_px; #diam_px;
    constructor(x, y, diam, team){
        this.dead = false;
        this.x = x;
        this.y = y;
        this.diam = diam;
        this.team = team;
        if(team==1)
            this.color = pawn_p1_color;
        else if(team==-1)
            this.color = pawn_p2_color;
    }

    #figure(){
        this.#x_px = (this.x+1)*cell_dimension_x*2;
        this.#y_px = (2+this.y)*cell_dimension_y*2;
        this.#diam_px = this.diam*cell_dimension_x;
        fill(this.color);
        circle(this.#x_px-cell_dimension_x, this.#y_px-cell_dimension_y, this.#diam_px);
    }

    display(){
        this.#figure();
        this.#getCell().color = (this.team==1) ? cell_p1_color : cell_p2_color;
        this.#getCell().colored = this.team;
        this.#getCell().pawn = this;
    }

    move(status=2){
        this.#colorMoveCells(this.#moveset(),status);
    }

    shift(){
        this.y++;
        if(this.y>=grid_size)
            this.y=0;

    }

    #moveset(){
        // list of x-y tuples-> 1 means forward -1 means backward, 0 means stay still
        let available_moves = [
            [1,0], [-1,0], [0,1], [0,-1], [1,1], [-1,-1], [1,-1], [-1,1]
        ]
        return available_moves;
    }

    #colorMoveCells(moveSet,status){
        for(let i=0; i<moveSet.length; i++){
            let x_ = this.x+moveSet[i][0]
            let y_ = this.y+moveSet[i][1]
            if(x_>=0 && x_<grid_size && y_>=0 && y_<grid_size){
                let index = grid_size*x_+y_;
                if(cells[index].pawn==null || cells[index].pawn.team!=this.team){
                    cells[index].status=status;
                    if(status==2)
                        cells[index].candidate_pawn = this;
                    else if (status==0)
                        cells[index].candidate_pawn = null;
                }
            }
        }
    }

    #getCell(){
        let index = grid_size*this.x+this.y;
        return cells[index];
    }

    die(){
        this.dead=true;
    }
}

class Pawn2 extends Pawn{
    #x_px; #y_px; #diam_px;
    constructor(x, y, diam, team){
        super(x,y,diam,team);
    }

    #figure(){
        this.#x_px = (this.x+1)*cell_dimension_x*2;
        this.#y_px = (2+this.y)*cell_dimension_y*2;
        this.#diam_px = this.diam*cell_dimension_x;
        fill(this.color);
        square(this.#x_px-cell_dimension_x-this.#diam_px/2, this.#y_px-cell_dimension_y-this.#diam_px/2, this.#diam_px);
    }

    display(){
        this.#figure();
        this.#getCell().color = (this.team==1) ? cell_p1_color : cell_p2_color;
        this.#getCell().colored = this.team;
        this.#getCell().pawn = this;
    }

    move(status=2){
        this.#colorMoveCells(this.#moveset(),status);
    }

    #moveset(){
        // list of x-y tuples-> 1 means forward -1 means backward, 0 means stay still
        let available_moves = [
            [1,0], [-1,0], [0,1], [0,-1], [1,1], [-1,-1], [1,-1], [-1,1]
        ]
        return available_moves;
    }

    #colorMoveCells(moveSet,status){
        for(let i=0; i<moveSet.length; i++){
            let x_ = this.x+moveSet[i][0]
            let y_ = this.y+moveSet[i][1]
            if(x_>=0 && x_<grid_size && y_>=0 && y_<grid_size){
                let index = grid_size*x_+y_;
                if(cells[index].pawn==null || cells[index].pawn.team!=this.team){
                    cells[index].status=status;
                    if(status==2)
                        cells[index].candidate_pawn = this
                    else if (status==0)
                        cells[index].candidate_pawn = null
                }
            }
        }
    }

    #getCell(){
        let index = grid_size*this.x+this.y;
        return cells[index];
    }

    die(){
        this.dead=true;
    }
}

class Cell {
    #x_px; #y_px; #width_px; #height_px;
    constructor(index, x, y, width, height, col = color(255,255,255), 
        col_hover = color(128,128,128), line_thick = 1){
        this.index = index;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.#x_px = x*cell_dimension_x;
        this.#y_px = y*cell_dimension_y;
        this.#width_px = width*cell_dimension_x;
        this.#height_px = height*cell_dimension_y;
        this.color =col;
        this.col_hover = col_hover;
        this.line_thick = line_thick;
        
        this.status = 0 //0: still, 1: move_start, 2: move_end, 3: candidate_merge
        this.pawn = null;
        this.candidate_pawn = null;
        this.colored = 0; //0: no color, 1: color 1, -1: color -1
    }

    move(new_x, new_y){
        let old_index = this.index;
        if(this.index%grid_size==grid_size-1)
            this.index -= (grid_size+1)
        else
            this.index+=1;
        cells.swap(old_index, this.index);
        if(this.pawn!=null){
            this.pawn.shift()
        }
    }

    display(){
        strokeWeight(this.line_thick);
        if(mouseX>this.#x_px && mouseX<this.#x_px+this.#width_px && 
            mouseY>this.#y_px && mouseY<this.#y_px+this.#height_px){
                fill(this.col_hover);        
        }else{
            if(this.status==0){
                fill(this.color);
            }
            else if(this.status==2)
                fill(movement_start_color);
            else if(this.status==1)
                fill(movement_end_color);
            else if(this.status==3){
                strokeWeight(this.line_thick*4);
                fill(this.color);
            }

        }

        rect(this.#x_px, this.#y_px, this.#width_px, this.#height_px);
    }

    #clearMovement(){
        cells.filter(c=>c.status==2 || c.status==1).forEach(c=>{
            c.status=0;
            c.candidate_pawn=null;
        });
    }

    clearMerging(){
        candidateMerging.splice(candidateMerging.indexOf(this),1);
        this.status=0;
        this.colored=0;
        this.color=color(255,255,255);  
    }

    click(){
        if(mouseX>this.#x_px && mouseX<this.#x_px+this.#width_px && 
            mouseY>this.#y_px && mouseY<this.#y_px+this.#height_px){
                if(this.pawn!=null){
                    if(this.status==0){
                        this.#clearMovement();
                        this.pawn.move();
                        this.status=1
                    }
                    else if(this.status==1){
                        this.pawn.move(0)
                        this.status=0
                    }
                }
                if(this.status==2){
                    let original_cell = cells[grid_size*this.candidate_pawn.x+this.candidate_pawn.y];

                    if(this.pawn!=null){
                        if(this.pawn.team!=original_cell.pawn.team)
                            this.pawn.die();
                    }

                    this.pawn = this.candidate_pawn
                    this.candidate_pawn = null
                    original_cell.status=0;
                    original_cell.pawn=null;
                    this.pawn.x = this.x/2;
                    this.pawn.y = this.y/2-1;
                    this.status=0;
                    this.#clearMovement();
                }

                if(this.pawn==null && this.colored!=0){
                    if(this.status==0){
                        this.status=3;
                        candidateMerging.push(this);
                    }
                    else if(this.status==3){
                        this.status=0;
                        candidateMerging.splice(candidateMerging.indexOf(this),1);
                    }
                    checkMerging();
                }
        }
    }
}

class Button {
    #x_px; #y_px; #width_px; #height_px;
    constructor(index, x, y, width, height, col = color(255,255,255), 
        col_hover = color(128,128,128), line_thick = 1){
        this.index = index;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.#x_px = x*cell_dimension_x;
        this.#y_px = y*cell_dimension_y;
        this.#width_px = width*cell_dimension_x;
        this.#height_px = height*cell_dimension_y;
        this.color =col;
        this.col_hover = col_hover;
        this.line_thick = line_thick;
    }

    display(){
        strokeWeight(this.line_thick);
        if(mouseX>this.#x_px && mouseX<this.#x_px+this.#width_px && 
            mouseY>this.#y_px && mouseY<this.#y_px+this.#height_px){
                fill(this.col_hover);        
        }else{
            fill(this.color);
        }
        
        rect(this.#x_px, this.#y_px, this.#width_px,this.#height_px);
    }

    click(){
        if(mouseX>this.#x_px && mouseX<this.#x_px+this.#width_px && 
            mouseY>this.#y_px && mouseY<this.#y_px+this.#height_px){
                let col_cells = cells.filter(c=>cells.indexOf(c)>=this.index*grid_size && cells.indexOf(c)<(this.index+1)*grid_size)
                for(let i=0;i<col_cells.length;i++){
                    let new_y = (col_cells[i].y+2)%(grid_size*2+1)
                    if(new_y<2) new_y+=1
                    col_cells[i].move(col_cells[i].x,new_y);
                }
        }
    }
}