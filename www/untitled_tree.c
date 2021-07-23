#include "stdio.h"
#include "stdlib.h"

typedef char datatype;

typedef struct Tnode
{
	datatype word;
	// Dữ liệu cất giữ ở nút
	struct Tnode *leftmost_child;
	struct Tnode *right_sibling;
} treeNode;

treeNode* makeNode(datatype v){
    treeNode* p = (treeNode*)malloc(sizeof(treeNode));
    if(p==NULL)
	{
		printf("Error\n");
		exit(1);
	}
    p->word = v;
    p->leftmost_child=NULL;
    p->right_sibling=NULL;
    return p;
}

void preOrder(treeNode *r){
	if(r!=NULL)
	{
		printf("%c ",r->word);
		treeNode *p=r->leftmost_child;
		while(p!=NULL){
			preOrder(p);
			p=p->right_sibling;
		}
	}
}

void postOrder(treeNode *r){
	if(r!=NULL)
	{
		treeNode *p=r->leftmost_child;
		while(p!=NULL){
			postOrder(p);
			p=p->right_sibling;
		}
		printf("%c ",r->word);
	}
}

void inOrder(treeNode *r){
	if(r!=NULL)
	{
		treeNode *p=r->leftmost_child;
		inOrder(p);
		
		printf("%c ",r->word);
		
		if(p!=NULL){
			p=p->right_sibling;
			while(p!=NULL){
				inOrder(p);
				p=p->right_sibling;
			}
		}
	}
}


int height(treeNode *r){
	if(r==NULL) return 0;
	int hi,max=0;
	treeNode *p=r->leftmost_child;
	while(p!=NULL){
		hi = height(p);
		if(hi>max) max=hi;
		p=p->right_sibling;
	}
	return max+1;
}

int leafcount(treeNode *r){
	if(r==NULL) return 0;
	treeNode *p=r->leftmost_child;
	if(p==NULL) return 1;
	int c=0;
	while(p!=NULL){
		c += leafcount(p);
		p=p->right_sibling;
	}
	
	return c;
}



int main(){
	treeNode *Root,*nutA,*nutB,*nutC,*nutD,*nutE,*nutF,*nutG,*nutH,*nutI,*nutJ,*nutK;
	nutA = makeNode('A');
	nutB = makeNode('B');
	nutC = makeNode('C');
	nutD = makeNode('D');
	nutE = makeNode('E');
	nutF = makeNode('F');
	nutG = makeNode('G');
	nutH = makeNode('H');
	nutI = makeNode('I');
	nutJ = makeNode('J');
	nutK = makeNode('K');
	
	Root=nutA;
	nutA->leftmost_child=nutB;
	
	nutB->leftmost_child=nutE;
	nutB->right_sibling=nutC;
	
	nutC->leftmost_child=nutG;
	nutC->right_sibling=nutD;
	
	nutE->right_sibling=nutF;
	
	nutG->leftmost_child=nutH;
	
	nutH->right_sibling=nutI;
	nutI->right_sibling=nutJ;
	nutJ->right_sibling=nutK;
	
	printf("Preorder\n");
	preOrder(Root);
	printf("\nPostorder\n");
	postOrder(Root);
	printf("\nInorder\n");
	inOrder(Root);
	printf("\nChieu cao cua cay: %d\n",height(Root));
	printf("\nSo nut la cua cay: %d\n",leafcount(Root));
	
	return 1;
}
