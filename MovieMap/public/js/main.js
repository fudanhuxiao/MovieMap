// Draw Node and Edges
var sys = arbor.ParticleSystem(1000, 400,1);
sys.parameters({gravity:true});
sys.renderer = Renderer("#viewport") ;
//var linkurl = 'http://localhost:3000/detailinfo';
var linkurl = '/getDetail';

// Lelel 0
sys.addNode(data[0].title,{'color':'rgb(192, 80, 77)','shape':'rect','label':data[0].title, 'link':linkurl+"?mid="+data[0].mid});

// Add Node of Level 1 and Level 2
// Link Levels
/*
for(i=1;i<data.length;i=i+3) {
	// Level1
	if(sys.getNode(data[i].title) == void 0) {
		sys.addNode(data[i].title,{'color':'rgb(155, 187, 89)','shape':'rect','label':data[i].title, 'link':linkurl+"?mid="+data[i].mid});
	}
	// Level2
	for(j=1; j<=2; j++){
		if(sys.getNode(data[i+j].title) == void 0) { // Check if the node name exists
			sys.addNode(data[i+j].title,{'color':'rgb(128, 100, 162)','shape':'rect','label':data[i+j].title, 'link':linkurl+"?mid="+data[i+j].mid});
		}
	}
	// Link Level0 - Level1
	sys.addEdge(data[0].title,data[i].title);
	// Link Level1 - Level2
	sys.addEdge(data[i].title,data[i+1].title);
	sys.addEdge(data[i].title,data[i+2].title);
}
*/
// Level 1
for(i=1;i<data.length;i=i+3) {
	// Level1
	if(sys.getNode(data[i].title) == void 0) {
		sys.addNode(data[i].title,{'color':'rgb(155, 187, 89)','shape':'rect','label':data[i].title, 'link':linkurl+"?mid="+data[i].mid});
	}
	// Link Level0 - Level1
	sys.addEdge(data[0].title,data[i].title, {'color':'rgb(192, 80, 77)', 'weight':2, 'directed':'true'});
}

//Level 2
for(i=1;i<data.length;i=i+3) {
	// Level2
	for(j=1; j<=2; j++){
		if(sys.getNode(data[i+j].title) == void 0) { // Check if the node name exists
			sys.addNode(data[i+j].title,{'color':'rgb(128, 100, 162)','shape':'rect','label':data[i+j].title, 'link':linkurl+"?mid="+data[i+j].mid});
		}
	}
	// Link Level1 - Level2
	sys.addEdge(data[i].title,data[i+1].title,{'color':'rgb(155, 187, 89)', 'weight':2, 'directed':'true'});
	sys.addEdge(data[i].title,data[i+2].title,{'color':'rgb(155, 187, 89)', 'weight':2, 'directed':'true'});
}

