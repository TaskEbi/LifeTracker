/** Computer Science: Cambridge International 9618, the A2 topics 13 to 20 (Papers 3 and 4). */
import { code, f, ol, sec, tbl, tip, topic, trap, ul, type NoteUnit } from '../types';

const theory = [
  topic(
    'cs-a2-data',
    '9618 · 13',
    'Data Representation',
    'User-defined data types · file organisation and access · floating-point numbers, normalisation and rounding errors',
    'Mantissa for precision, exponent for range.',
    ['Enumerated type: A non-composite type defined by an ordered list of its possible values.', 'Pointer type: A non-composite type whose value is the address of a variable of a given type.', 'Composite type: A type built from other types, such as a record, a set or a class.', 'Mantissa: The fractional part of a floating-point number, holding its significant digits.', 'Exponent: The power of two by which the mantissa is scaled.', 'Normalised: Stored so the mantissa starts 01 (positive) or 10 (negative), giving the most precision.', 'Hashing algorithm: A calculation on a key field that gives the record’s address.'],
    [
      sec(
        'User-defined types',
        code('TYPE Season = (Spring, Summer, Autumn, Winter)\nTYPE IntPointer = ^INTEGER\nTYPE Student\n    DECLARE Name : STRING\n    DECLARE Year : INTEGER\nENDTYPE\nTYPE Vowels = SET OF CHAR'),
        ul('**Non-composite:** enumerated and pointer types; defined without reference to another type’s fields.', '**Composite:** record, set, class/object; group several values together.', 'Why define your own: the program matches the problem, is easier to read, and the compiler can catch a value of the wrong type.'),
      ),
      sec(
        'File organisation and access',
        tbl(
          ['Organisation', 'Records are stored', 'Access', 'Good for'],
          ['Serial', 'In the order they arrive', 'Sequential', 'Logs, transaction files'],
          ['Sequential', 'In key-field order', 'Sequential', 'Batch processing where most records are used, such as payroll'],
          ['Random', 'At an address found by hashing the key', 'Direct', 'Fast look-up of one record, such as a booking'],
        ),
        'A **collision** is two keys hashing to the same address. Deal with it by using the next free location (open addressing), an overflow area, or a linked list at that address. A sequential file can also be read directly through an index.',
      ),
      sec(
        'Floating-point numbers',
        f('value = mantissa × 2^{exponent}'),
        ol('Both parts are in two’s complement; the binary point follows the first bit of the mantissa.', 'To convert to denary: work out the exponent, move the binary point that many places (right if positive), then read the value.', 'To normalise: shift the mantissa left until it starts 01 or 10, and subtract one from the exponent for each shift.'),
        ul('More bits for the mantissa: more **precision**. More bits for the exponent: a larger **range**.', 'Many denary fractions (0.1, for example) have no exact binary form, so they are stored as an approximation and **rounding errors** build up.', '**Overflow:** the number is too large for the exponent. **Underflow:** it is too close to zero to store.'),
        trap('Never test two real numbers for equality. Test whether their difference is smaller than a tolerance.'),
      ),
    ],
  ),
  topic(
    'cs-a2-comm',
    '9618 · 14',
    'Communication and Internet Technologies',
    'Protocols and why they are layered · the TCP/IP suite · HTTP, FTP, SMTP, POP3, IMAP and BitTorrent · circuit switching and packet switching',
    'Each layer talks only to the layers next to it.',
    ['Protocol: An agreed set of rules for communication between devices.', 'Protocol stack: Protocols arranged in layers, each using the one below.', 'Packet: A unit of data with a header (addresses, sequence number) and a payload.', 'Circuit switching: A dedicated path is set up and held for the whole communication.', 'Packet switching: Data is split into packets that are routed independently.', 'Swarm: The peers sharing one file with BitTorrent.'],
    [
      sec(
        'The TCP/IP protocol suite',
        tbl(
          ['Layer', 'What it does', 'Protocols'],
          ['Application', 'Provides services to programs; formats the data', 'HTTP(S), FTP, SMTP, POP3, IMAP, BitTorrent'],
          ['Transport', 'Splits data into segments, adds port and sequence numbers, handles errors and resending', 'TCP, UDP'],
          ['Internet', 'Adds source and destination IP addresses; routes packets', 'IP'],
          ['Link', 'Puts packets into frames with MAC addresses for the physical network', 'Ethernet, Wi-Fi'],
        ),
        ul('**Why layers:** each can be developed, tested and replaced on its own; equipment from different makers works together.', '**SMTP** sends (pushes) mail; **POP3** downloads it and usually deletes it from the server; **IMAP** keeps it on the server and syncs devices.', '**BitTorrent:** peer-to-peer. A tracker lists the peers in the swarm; a file is shared in pieces; a seed has the whole file; a leech downloads more than it uploads.'),
      ),
      sec(
        'Circuit and packet switching',
        tbl(
          ['', 'Circuit switching', 'Packet switching'],
          ['Path', 'One dedicated path for the whole call', 'Each packet takes its own route'],
          ['Order of arrival', 'In order', 'May be out of order; reassembled from sequence numbers'],
          ['Bandwidth', 'Reserved, wasted when silent', 'Shared, used only when sending'],
          ['Failure', 'A broken link ends the call', 'Packets are routed round it'],
          ['Good for', 'Real-time voice on the old telephone network', 'Web pages, email, files'],
        ),
        tip('In an "explain how a packet reaches its destination" answer, mention the header: destination IP address, sequence number, and that routers use a routing table to choose the next hop.'),
      ),
    ],
  ),
  topic(
    'cs-a2-hardware',
    '9618 · 15',
    'Hardware and Virtual Machines',
    'RISC and CISC · pipelining · parallel processing · virtual machines · Boolean algebra · Karnaugh maps · half and full adders · flip-flops',
    'Group the ones in powers of two.',
    ['RISC: Reduced instruction set computer: few, simple, fixed-length instructions.', 'CISC: Complex instruction set computer: many instructions, some doing several steps.', 'Pipelining: Overlapping the stages of several instructions so one finishes every clock cycle.', 'Virtual machine: Software that emulates a different computer system.', 'Flip-flop: A circuit that stores one bit.', 'Karnaugh map: A grid for simplifying a Boolean expression by grouping ones.'],
    [
      sec(
        'Processors',
        tbl(
          ['', 'RISC', 'CISC'],
          ['Instructions', 'Few, simple, fixed length', 'Many, some complex, variable length'],
          ['Addressing modes', 'Few', 'Many'],
          ['Registers', 'Many', 'Fewer'],
          ['Memory access', 'Only load and store', 'Many instructions use memory'],
          ['Control unit', 'Hard-wired', 'Microprogrammed'],
          ['Pipelining', 'Easy', 'Hard'],
        ),
        ul('**Pipelining:** while one instruction executes, the next is decoded and the one after is fetched. A branch means the pipeline must be flushed.', '**Flynn’s classes:** SISD (one processor, one data stream), SIMD (one instruction on many data items, as in a graphics processor), MISD, MIMD (many processors working independently, as in multi-core).', '**Massively parallel computers:** many processors linked by a network, working on parts of one problem; the software must be written to split the task.'),
      ),
      sec(
        'Virtual machines',
        'A virtual machine lets a guest operating system run on a host. **For:** try software safely, run old or other-platform programs, several systems on one computer, easy to copy and restore. **Against:** slower than real hardware, uses a lot of the host’s memory, cannot always reach the host’s devices directly.',
      ),
      sec(
        'Boolean algebra and Karnaugh maps',
        f('A + A.B = A', 'A.(B + C) = A.B + A.C', 'NOT(A.B) = NOT A + NOT B', 'NOT(A + B) = NOT A . NOT B'),
        ol('Label the map in Gray-code order: 00, 01, 11, 10.', 'Put a 1 in each cell where the output is 1.', 'Draw the largest groups of 1, 2, 4 or 8 ones; groups may wrap round the edges and overlap.', 'For each group, keep only the variables that do not change.', 'OR the group terms together.'),
        trap('A group of three or six is not allowed. Sizes are powers of two only.'),
      ),
      sec(
        'Adders and flip-flops',
        ul('**Half adder:** Sum = A XOR B, Carry = A AND B.', '**Full adder:** two half adders and an OR gate; it also takes a carry in.', '**SR flip-flop:** set and reset inputs; S = R = 1 is not allowed because the output is undefined.', '**JK flip-flop:** clocked, so it changes only on a clock pulse, and J = K = 1 toggles the output: no invalid state.', 'Flip-flops are the storage elements of registers and static RAM.'),
      ),
    ],
  ),
  topic(
    'cs-a2-system',
    '9618 · 16',
    'System Software',
    'How an operating system shares the processor and memory · scheduling · paging and virtual memory · stages of compilation · BNF and syntax diagrams · reverse Polish notation',
    'The scheduler decides who runs next.',
    ['Process: A program that has started running.', 'Scheduling: Deciding which process gets the processor, and for how long.', 'Page: A fixed-size block of a program’s memory.', 'Virtual memory: Using secondary storage as an extension of RAM.', 'Lexical analysis: Turning source code into tokens.', 'Reverse Polish notation: Writing an expression with each operator after its operands.'],
    [
      sec(
        'Processes and scheduling',
        tbl(['State', 'Meaning'], ['Running', 'Using the processor now'], ['Ready', 'Could run, waiting for the processor'], ['Blocked', 'Waiting for an event such as input or output']),
        tbl(
          ['Routine', 'Rule', 'Note'],
          ['Round robin', 'Each process gets a time slice in turn', 'Fair; pre-emptive'],
          ['First come, first served', 'In order of arrival', 'Simple; a long job holds everyone up'],
          ['Shortest job first', 'Shortest estimated time first', 'Non-pre-emptive; long jobs may starve'],
          ['Shortest remaining time', 'Least time left to finish first', 'Pre-emptive'],
        ),
        'An **interrupt** makes the kernel save the running process’s state and run an interrupt service routine. The scheduler aims to keep the processor busy, give fair shares and answer interactive users quickly.',
      ),
      sec(
        'Memory management',
        ul('**Paging:** memory is divided into fixed-size frames and programs into pages of the same size. A page table maps each page to its frame.', '**Segmentation:** programs are divided into logical blocks of different sizes.', '**Virtual memory:** only the pages in use are held in RAM. Asking for a page that is not there is a page fault; the page is swapped in from disk.', '**Disk thrashing:** so much swapping that little real work is done. More RAM cures it.'),
      ),
      sec(
        'Translation',
        ol('**Lexical analysis:** remove spaces and comments, turn keywords and identifiers into tokens, build the symbol table.', '**Syntax analysis:** check the tokens against the grammar (parsing) and report syntax errors.', '**Code generation:** produce object code.', '**Optimisation:** make the code shorter or faster without changing what it does.'),
        code('<digit>    ::= 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9\n<letter>   ::= A | B | C\n<variable> ::= <letter> | <variable><digit>'),
        'In **Backus–Naur form** `::=` means "is defined as" and `|` means "or". A rule that uses itself is recursive. A syntax diagram shows the same rule as a path to follow.',
      ),
      sec(
        'Reverse Polish notation',
        tbl(['Infix', 'Reverse Polish'], ['a + b', 'a b +'], ['(a + b) * c', 'a b + c *'], ['a + b * c', 'a b c * +'], ['(a − b) / (c + d)', 'a b − c d + /']),
        'It needs no brackets and no rules of precedence, and is evaluated left to right with a **stack**: push each operand; for an operator, pop two values, apply it and push the result.',
        trap('When popping for − or /, the first value popped is the right-hand operand.'),
      ),
    ],
  ),
  topic(
    'cs-a2-security',
    '9618 · 17',
    'Security',
    'Symmetric and asymmetric encryption · SSL/TLS · digital signatures and certificates · quantum cryptography',
    'Public key locks, private key opens.',
    ['Plaintext: The data before encryption.', 'Ciphertext: The data after encryption.', 'Symmetric encryption: One secret key both encrypts and decrypts.', 'Asymmetric encryption: A matched public and private key; what one encrypts only the other decrypts.', 'Digest: The fixed-length result of hashing a message.', 'Digital certificate: A document from a certificate authority linking a public key to its owner.'],
    [
      sec(
        'Encryption',
        tbl(
          ['', 'Symmetric', 'Asymmetric'],
          ['Keys', 'One shared secret key', 'A public key and a private key'],
          ['Speed', 'Fast', 'Slow'],
          ['Problem', 'Getting the key to the other person safely', 'Being sure whose public key it is'],
          ['Used for', 'The bulk of the data', 'Exchanging the symmetric key; signatures'],
        ),
        'To send a secret message, encrypt with the **receiver’s public key**: only the receiver’s private key can decrypt it.',
      ),
      sec(
        'Signatures and certificates',
        ol('The sender hashes the message to get a digest.', 'The sender encrypts the digest with their **private key**: this is the digital signature.', 'The receiver decrypts the signature with the sender’s public key, and hashes the message themselves.', 'If the two digests match, the message is unaltered and came from the sender.'),
        'A **digital certificate** holds the owner’s name, their public key, the issuer, a serial number and expiry date, all signed by the certificate authority. It answers "is this really their public key?".',
      ),
      sec(
        'SSL/TLS and quantum cryptography',
        ul('**TLS handshake:** the browser asks for a secure connection; the server sends its certificate; the browser checks it; the two agree a session key with asymmetric encryption; then all data uses that symmetric key.', 'Used wherever data must be private and the server authentic: banking, shopping, logins (https and the padlock).', '**Quantum cryptography:** the key is sent as polarised photons. Measuring a photon changes it, so eavesdropping is detected. Limits: short range, needs dedicated fibre, expensive.'),
        tip('Say **which** key at every step: "encrypted with the sender’s private key" scores; "encrypted with a key" does not.'),
      ),
    ],
  ),
  topic(
    'cs-a2-ai',
    '9618 · 18',
    'Artificial Intelligence',
    'Graphs · Dijkstra’s algorithm · the A* algorithm · machine learning · artificial neural networks, deep learning and back propagation',
    'A* is Dijkstra with a sense of direction.',
    ['Graph: Nodes joined by edges, which may carry weights.', 'Heuristic: An estimate of the cost from a node to the goal.', 'Supervised learning: Learning from labelled examples.', 'Unsupervised learning: Finding patterns in unlabelled data.', 'Reinforcement learning: Learning by trial and error from rewards and penalties.', 'Back propagation: Passing the error back through a network to adjust its weights.'],
    [
      sec(
        'Shortest paths',
        ol('Give the start node a distance of 0 and every other node infinity.', 'Choose the unvisited node with the smallest distance.', 'For each unvisited neighbour, add the edge weight; keep the new distance if it is smaller, and record where it came from.', 'Mark the node visited and repeat until the goal has been visited.'),
        f('A*:   f(n) = g(n) + h(n)'),
        'In **A***, g is the cost so far and h is the heuristic. The node with the smallest f is expanded next, so the search heads towards the goal and usually examines fewer nodes than Dijkstra. Uses: route planning, network routing, game characters.',
        trap('The heuristic must never overestimate the real cost, or A* may miss the shortest path.'),
      ),
      sec(
        'Machine learning',
        tbl(
          ['Kind', 'Data', 'Example'],
          ['Supervised', 'Inputs with the correct outputs', 'Classifying email as spam'],
          ['Unsupervised', 'Inputs only', 'Grouping customers by what they buy'],
          ['Reinforcement', 'Rewards for actions', 'A program learning to play a game'],
        ),
        '**Regression** fits a relationship to data to predict a value. **Deep learning** is machine learning with neural networks that have many hidden layers.',
      ),
      sec(
        'Artificial neural networks',
        ul('Layers of nodes: an **input** layer, one or more **hidden** layers, an **output** layer.', 'Each connection has a **weight**. A node sums its weighted inputs and passes the total through an activation function.', '**Training:** feed in examples, compare the output with the correct answer, and use back propagation to change the weights so the error falls. Repeat many times.', 'More hidden layers can learn more complicated patterns, but need more data and processing.'),
      ),
    ],
  ),
];

const practical = [
  topic(
    'cs-a2-algorithms',
    '9618 · 19',
    'Computational Thinking and Problem-solving',
    'Linear and binary search · insertion and bubble sort · stacks, queues, linked lists, binary trees, dictionaries and graphs · Big O notation · recursion',
    'Halving the list is why binary search is fast.',
    ['Abstract data type: A collection of data and the operations allowed on it, whatever the implementation.', 'Big O notation: How an algorithm’s time or memory grows with the size of its input.', 'Recursion: A subroutine defined in terms of itself.', 'Base case: The case a recursive routine answers without calling itself.', 'Unwinding: Returning through the stacked calls once the base case is reached.'],
    [
      sec(
        'Searching and sorting',
        tbl(
          ['Algorithm', 'Time', 'Needs'],
          ['Linear search', 'O(n)', 'Nothing'],
          ['Binary search', 'O(log n)', 'A sorted list'],
          ['Bubble sort', 'O(n^2), O(n) if already sorted and a flag is used', 'Nothing'],
          ['Insertion sort', 'O(n^2), O(n) if nearly sorted', 'Nothing'],
        ),
        code('FUNCTION BinarySearch(List : ARRAY, Target : INTEGER) RETURNS INTEGER\n    Low <- 1\n    High <- LENGTH(List)\n    WHILE Low <= High\n        Mid <- (Low + High) DIV 2\n        IF List[Mid] = Target THEN\n            RETURN Mid\n        ELSE\n            IF List[Mid] < Target THEN\n                Low <- Mid + 1\n            ELSE\n                High <- Mid - 1\n            ENDIF\n        ENDIF\n    ENDWHILE\n    RETURN -1\nENDFUNCTION'),
        'Performance depends on the size of the data and how ordered it already is.',
      ),
      sec(
        'Abstract data types',
        tbl(
          ['ADT', 'Behaviour', 'Built from'],
          ['Stack', 'Last in, first out; push and pop at the top', 'An array and a top pointer'],
          ['Queue', 'First in, first out; often circular', 'An array with head and tail pointers'],
          ['Linked list', 'Each node points to the next', 'Arrays of data and pointers, plus a free list'],
          ['Binary tree', 'Each node has a left and a right pointer; smaller values go left', 'Arrays or objects'],
          ['Dictionary', 'Key–value pairs', 'A hash table or linked lists'],
          ['Graph', 'Nodes and edges', 'An adjacency matrix or adjacency lists'],
        ),
        'To find an item in a binary tree: start at the root; go left if the item is smaller, right if larger; stop at a match or a null pointer. An in-order traversal visits the items in sorted order.',
      ),
      sec(
        'Recursion',
        code('FUNCTION Factorial(N : INTEGER) RETURNS INTEGER\n    IF N = 0 THEN\n        RETURN 1\n    ELSE\n        RETURN N * Factorial(N - 1)\n    ENDIF\nENDFUNCTION'),
        ul('A recursive routine must have a base case, and each call must move towards it.', 'Each call puts its return address, parameters and local variables on the **stack**; they are popped as the calls unwind.', '**For:** short and close to the definition for trees, factorials and divide-and-conquer. **Against:** uses more memory and can overflow the stack; a loop is often faster.'),
        trap('No base case, or one that is never reached, ends in a stack overflow.'),
      ),
    ],
  ),
  topic(
    'cs-a2-programming',
    '9618 · 20',
    'Further Programming',
    'Programming paradigms · object-oriented programming · declarative programming · file processing · exception handling',
    'A class is the plan; an object is the thing built.',
    ['Paradigm: A style of programming with its own way of thinking about a problem.', 'Class: A template that defines the attributes and methods of its objects.', 'Encapsulation: Keeping attributes private to a class and reaching them only through its methods.', 'Inheritance: A subclass takes on the attributes and methods of its parent class.', 'Polymorphism: A method behaves differently depending on the class of the object.', 'Exception: An unexpected event that interrupts the normal running of a program.'],
    [
      sec(
        'Paradigms',
        tbl(
          ['Paradigm', 'The program is', 'Example'],
          ['Low-level', 'Instructions for one processor, using its registers and addressing modes', 'Assembly language'],
          ['Imperative', 'A sequence of statements that change the program’s state', 'Pascal, Python procedures'],
          ['Object-oriented', 'Objects that hold data and the methods that act on it', 'Java, Python classes'],
          ['Declarative', 'Facts and rules; you state what is wanted, not how', 'Prolog, SQL'],
        ),
        code('parent(anna, ben).\nparent(ben, cara).\ngrandparent(X, Z) :- parent(X, Y), parent(Y, Z).\n\n?- grandparent(anna, Who).\nWho = cara'),
        'In Prolog a **fact** states something true, a **rule** derives new facts, and a **query** asks a question. Names starting with a capital letter are variables.',
      ),
      sec(
        'Object-oriented programming',
        code('class Animal:\n    def __init__(self, name):\n        self.__name = name          # private attribute\n\n    def get_name(self):             # getter\n        return self.__name\n\n    def speak(self):\n        return "..."\n\nclass Dog(Animal):                  # inheritance\n    def speak(self):                # overriding: polymorphism\n        return "Woof"\n\npet = Dog("Rex")                    # instantiation'),
        ul('The **constructor** runs when an object is created and sets its attributes.', '**Getters** return and **setters** change a private attribute, so the class can validate the new value.', '**Containment** (aggregation): one class holds objects of another.', 'Benefits: code is reused through inheritance, data is protected, classes can be tested on their own.'),
      ),
      sec(
        'Files and exceptions',
        code('try:\n    with open("scores.txt", "r") as file:\n        for line in file:\n            print(line.strip())\nexcept FileNotFoundError:\n    print("No scores have been saved yet.")'),
        ul('File modes: read, write (starts the file again) and append (adds to the end). Always close a file so the data is written.', 'A **random file** is opened for direct access and a record is read or written at a given address (seek, then get or put).', '**Exception handling:** code that might fail goes in a try block; the handler deals with the problem so the program does not crash. Causes: a missing file, division by zero, input of the wrong type, an index out of range.'),
        tip('Paper 4 is practical: save often, test each part as you write it, and paste the evidence asked for into the document as you go.'),
      ),
    ],
  ),
];

export const CS_A2: NoteUnit[] = [
  { id: 'p3', code: 'Paper 3', name: 'Advanced Theory', a2: true, topics: theory },
  { id: 'p4', code: 'Paper 4', name: 'Practical', a2: true, topics: practical },
];
