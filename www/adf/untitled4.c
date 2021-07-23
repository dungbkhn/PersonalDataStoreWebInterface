#include "stdio.h"
#include "stdlib.h"


typedef struct Polynom {
	int coeff;
	int pow;
	struct Polynom *link;
} Poly;


Poly *sum(Poly *Poly1, Poly *Poly2)
{
	Poly *ptr1=Poly1,*ptr2=Poly2,*psum,*node,*ptr;
	
	node=(Poly *)malloc (sizeof(Poly));
	psum=node;

	while(ptr1!=NULL && ptr2!=NULL){
		ptr=node;
		if (ptr1->pow > ptr2->pow ) {
			node->coeff=ptr2->coeff;
			node->pow=ptr2->pow;
			ptr2=ptr2->link;
			//update ptr list 2
		}
		else if ( ptr1->pow < ptr2->pow )
		{
			node->coeff=ptr1->coeff;
			node->pow=ptr1->pow;
			ptr1=ptr1->link;
			//update ptr list 1
		}
		else
		{
			node->coeff=ptr2->coeff+ptr1->coeff;
			node->pow=ptr2->pow;
			ptr1=ptr1->link;
			//update ptr list 1
			ptr2=ptr2->link;
			//update ptr list 2
		}
		node=(Poly *)malloc (sizeof(Poly));
		ptr->link=node;
		//update ptr list 3
	} //end of while
	
	if (ptr1==NULL)//end of list 1
	{ 
		while(ptr2!=NULL){
			node->coeff=ptr2->coeff; node->pow=ptr2->pow;
			ptr2=ptr2->link;
			//update ptr list 2
			ptr=node; node=(Poly *)malloc (sizeof(Poly));
			ptr->link=node; 
		} //update ptr list 3
	}
	else if (ptr2==NULL)//end of list 2
	{
		while(ptr1!=NULL) {
			node->coeff=ptr1->coeff;
			node->pow=ptr1->pow;
			ptr1=ptr1->link;
			//update ptr list 2
			ptr=node;
			node=(Poly *)malloc (sizeof(Poly));
			ptr->link=node;
			//update ptr list 3
		}
	}
	
	node=NULL;
	ptr->link=node;

	return psum;
}

Poly* makeNode(int co,int po){
    Poly* p = (Poly*)malloc(sizeof(Poly));
    if(p==NULL)
	{
		printf("Error\n");
		exit(1);
	}
    p->coeff = co;
    p->pow=po;
    p->link = NULL;
    return p;
}

void printList(Poly *list){
    Poly *tg=list;
    printf("\n");
    while(tg!=NULL)
    {
        printf("%d-%d ",tg->coeff,tg->pow);
        tg=tg->link;
    }
}

int main(){
	Poly *poly1, *poly2, *poly3;
	poly1 = makeNode(-10,0);
	poly1->link=makeNode(3,1);
	poly1->link->link=makeNode(2,3);
	poly1->link->link->link=makeNode(1,4);
	printList(poly1);
	
	poly2 = makeNode(5,2);
	poly2->link=makeNode(1,4);
	printList(poly2);
	
	poly3=sum(poly1,poly2);
	printList(poly3);
	
	return 1;
}
