#include "stdio.h"
#include "stdlib.h"

#define MIN_VAL -2000000000

typedef struct Node{
    int value;
    struct Node *next;
} StackNode;

typedef struct _Stack {
    StackNode *top;
} Stack;

Stack *StackConstruct() {
    Stack *s;
    s = (Stack *)malloc(sizeof(Stack));
    if (s == NULL) {
		printf("Mem Error\n");
		exit(1);  // No memory
    }
    s->top = NULL;
    return s;
}

int StackEmpty(const Stack *s) {
    return (s->top == NULL);
}

void StackPush(Stack *s, int item) {
    StackNode *node;
    node = (StackNode *)malloc(sizeof(StackNode)); //(1)
    if (node == NULL) {
		exit(1);  // Tràn Stack: hết bộ nhớ
    }
    node->value = item;       //(1)
    node->next = s->top;     //(2)
    s->top = node;           //(3)
}

int StackPop(Stack *s) {
    int item;
    StackNode *node;
    if (StackEmpty(s)) {        //(1)
		// Empty Stack, can't pop
		return MIN_VAL;
    }
    node = s->top;             //(2)
    item = node->value;         //(3)
    s->top = node->next;       //(4)
    free(node);                //(5)
    return item;               //(6)
}

void chuyendoicoso(Stack *s, int n, int b){
	if(!StackEmpty(s)) return;
	while(n!=0){
		StackPush(s,n%b);
		n=n/b;
	}
	while(!StackEmpty(s)){
		printf("%d ",StackPop(s));
	}
}

int main(){
	Stack *s= StackConstruct();
	chuyendoicoso(s,254,2);
	
	return 1;
}
