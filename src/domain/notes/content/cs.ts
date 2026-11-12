/** Computer Science: Cambridge International AS Level 9618, topics 1–12 (Papers 1 and 2). */
import { code, f, fig, h, ol, sec, tbl, tip, topic, trap, ul, type NoteSubject } from '../types';

const SITE = 'https://csrevisiontopic2.netlify.app';

const theory = [
  topic(
    'cs-data',
    '9618 · 1',
    'Information Representation',
    'Binary, hexadecimal and BCD · two’s complement · character sets · bitmap and vector graphics · sound · compression',
    'Everything is bits; the context gives them meaning.',
    ['Two’s complement: A way of storing signed integers in which the most significant bit has a negative place value.', 'Overflow: A result too large for the number of bits available.', 'Colour depth: The number of bits used to store the colour of one pixel.', 'Sampling rate: The number of sound samples taken per second (Hz).', 'Lossless compression: The original file can be rebuilt exactly.', 'Lossy compression: Some data is permanently removed.'],
    [
      sec(
        'Numbers',
        tbl(['Prefix', 'Denary', 'Binary prefix'], ['kilo (k) 10^3', '1000', 'kibi (Ki) 2^{10} = 1024'], ['mega (M) 10^6', '1 000 000', 'mebi (Mi) 2^{20}'], ['giga (G) 10^9', '10^9', 'gibi (Gi) 2^{30}']),
        ul('**Hexadecimal:** one hex digit is four bits. Used because it is shorter and easier for people to read than binary (memory addresses, colour codes, MAC addresses).', '**Two’s complement:** in 8 bits the range is −128 to +127. To negate: invert the bits and add 1.', '**BCD:** each denary digit stored as its own 4-bit code; used where exact decimal digits matter (calculators, clocks, currency).', '**Overflow** happens when a sum does not fit, for example adding two positive numbers and getting a negative result.'),
        'Characters: ASCII uses 7 bits (128 characters), extended ASCII 8 bits, Unicode up to 32 bits so it covers every language. Codes for letters are in order, so "A" < "B".',
      ),
      sec(
        'Images and sound',
        f('bitmap size = width × height × colour depth  (bits)', 'sound size = sampling rate × sampling resolution × seconds × channels  (bits)'),
        tbl(['', 'Bitmap', 'Vector'], ['Made of', 'Pixels', 'A drawing list of objects and their properties'], ['Scaling', 'Pixelates', 'Redrawn, no loss of quality'], ['File size', 'Larger', 'Usually smaller'], ['Best for', 'Photographs', 'Logos, diagrams']),
        'Higher sampling rate and resolution mean a more accurate sound and a larger file. The file header holds metadata such as dimensions and colour depth.',
      ),
      sec(
        'Compression',
        ul('**Lossless** (text, programs, spreadsheets): run-length encoding stores a value and how many times it repeats.', '**Lossy** (photos, music, video): removes detail people are unlikely to notice, such as sounds outside hearing range or similar colours.', 'Reasons: less storage, faster transfer, less bandwidth for streaming.'),
        tip('In a "justify the choice" question, tie the method to the file: a program must be lossless because any lost bit breaks it.'),
      ),
    ],
  ),
  topic(
    'cs-comm',
    '9618 · 2',
    'Communication',
    'LANs and WANs · client-server and peer-to-peer · topologies · cloud computing · Ethernet and CSMA/CD · IP addressing · DNS',
    'A router joins networks. A switch joins devices.',
    ['LAN: A network over a small geographical area, on privately owned infrastructure.', 'WAN: A network over a large area, using third-party links.', 'Client-server: Clients request services from a central server that holds the resources.', 'Peer-to-peer: Every computer has equal status and can share its own resources.', 'IP address: A numerical address that identifies a device on a network.', 'DNS: The system that translates a domain name into an IP address.'],
    [
      sec(
        'Networks',
        tbl(['Topology', 'Layout', 'Note'], ['Bus', 'One shared cable', 'Cheap; collisions; one cable break stops everything'], ['Star', 'Every device to a central switch', 'A cable fault affects one device; the switch is a single point of failure'], ['Mesh', 'Devices linked to many others', 'Many routes, robust; expensive'], ['Hybrid', 'A mix', 'How the internet is built']),
        ul('**Switch:** sends a frame only to the device with the matching MAC address. **Router:** forwards packets between networks by IP address. **WAP:** lets wireless devices join. **NIC:** gives a device its network connection and MAC address.', '**Wired** (copper, fibre-optic): faster, more secure, less interference. **Wireless** (Wi-Fi, radio, microwave, satellite): mobile, easier to add devices.', '**Cloud computing:** storage and software on remote servers reached over the internet; public or private. Access from anywhere and easy scaling, but it needs a connection and trusts a third party with the data.', '**CSMA/CD** on Ethernet: listen before sending; if a collision is detected, stop, wait a random time, and send again.', '**Bit streaming:** real-time (live, sent as it happens) or on-demand (stored on a server). A buffer smooths playback; the bit rate must suit the connection.'),
      ),
      sec(
        'Addresses and names',
        tbl(['', 'IPv4', 'IPv6'], ['Size', '32 bits', '128 bits'], ['Written as', 'Four denary numbers, 0–255, with dots', 'Eight groups of four hex digits, with colons'], ['Why', '—', 'IPv4 addresses are running out']),
        ul('**Public** addresses are unique on the internet; **private** ones are used inside a LAN and hidden behind the router.', '**Static** addresses never change (servers); **dynamic** ones are handed out by DHCP each time a device joins.', '**Subnetting** splits a network into smaller ones: less congestion, better security.'),
        ol('The browser sends the domain name from the URL to a DNS server.', 'The DNS server looks it up; if it is not there, it asks another DNS server.', 'The IP address is returned to the browser.', 'The browser sends its request to that IP address.'),
      ),
    ],
    { link: { label: 'Full notes, labs and flashcards for Topic 2', href: SITE } },
  ),
  topic(
    'cs-hardware',
    '9618 · 3',
    'Hardware',
    'Primary and secondary storage · RAM and ROM · embedded systems · sensors and actuators · logic gates and circuits',
    'RAM forgets. ROM remembers.',
    ['Volatile: Loses its contents when the power is turned off.', 'Embedded system: A computer built into a larger device to do one dedicated job.', 'Buffer: A temporary store that holds data moving between devices working at different speeds.', 'Sensor: A device that measures a physical quantity.', 'Actuator: A device that turns a control signal into movement.', 'Logic gate: A circuit whose output depends on its binary inputs.'],
    [
      sec(
        'Memory and storage',
        tbl(['', 'RAM', 'ROM'], ['Volatile', 'Yes', 'No'], ['Written to', 'Read and write', 'Read only'], ['Holds', 'Running programs and their data', 'Start-up instructions (boot program)']),
        tbl(['', 'SRAM', 'DRAM'], ['Built from', 'Flip-flops', 'Capacitors and transistors'], ['Refresh', 'Not needed', 'Must be refreshed constantly'], ['Speed, cost', 'Faster, dearer', 'Slower, cheaper, more bits per chip'], ['Used for', 'Cache', 'Main memory']),
        ul('**PROM** can be programmed once; **EPROM** is erased with ultraviolet light; **EEPROM** is erased electrically and is the basis of flash memory.', '**Magnetic** (hard disk): platters, tracks and sectors, a moving read/write head. **Solid state** (flash): no moving parts, faster, tougher. **Optical**: a laser reads pits and lands.', '**Embedded systems** (washing machine, engine control): cheap, small, low power, but hard to upgrade.'),
      ),
      sec(
        'Monitoring and control',
        'A **monitoring** system only reads sensors and reports. A **control** system also acts: sensor → analogue-to-digital converter → processor compares with stored values → actuator. The actuator’s effect is measured again by the sensor: this is **feedback**.',
      ),
      sec(
        'Logic gates',
        tbl(['Gate', 'Output is 1 when'], ['NOT', 'The input is 0'], ['AND', 'Both inputs are 1'], ['OR', 'At least one input is 1'], ['NAND', 'Not both inputs are 1'], ['NOR', 'Both inputs are 0'], ['XOR', 'The inputs are different']),
        'Build a truth table by listing every input combination (2^n rows for n inputs) and working through the circuit one gate at a time, with a column for each intermediate output.',
      ),
    ],
    { link: { label: 'Full notes, labs and flashcards for Topic 3', href: `${SITE}/hardware/` } },
  ),
  topic(
    'cs-processor',
    '9618 · 4',
    'Processor Fundamentals',
    'Von Neumann model · registers and buses · the fetch–execute cycle · interrupts · assembly language · bit manipulation',
    'Fetch, decode, execute, check for interrupts.',
    ['Stored program concept: Instructions and data are held together in the same memory.', 'Register: A small, fast storage location inside the processor.', 'Bus: A set of parallel wires carrying addresses, data or control signals.', 'Interrupt: A signal to the processor that something needs its attention.', 'Opcode: The part of an instruction that says what to do.', 'Operand: The part that says what to do it to.'],
    [
      sec(
        'Inside the CPU',
        tbl(['Register', 'Holds'], ['PC', 'The address of the next instruction'], ['MAR', 'The address being read from or written to'], ['MDR', 'The data just read or about to be written'], ['CIR', 'The instruction being decoded and executed'], ['ACC', 'Results of calculations'], ['IX', 'A value added to an address in indexed addressing'], ['Status', 'Flags such as carry, negative, overflow, zero']),
        ul('**ALU** does arithmetic and logic; the **control unit** sends timing and control signals; the **system clock** synchronises them.', '**Address bus** (one way, CPU to memory; its width sets how much memory can be addressed), **data bus** (both ways; its width sets the word size), **control bus** (both ways: read, write, clock, interrupt).', 'Performance: more **cores**, a faster **clock**, more **cache**, wider **buses**.', 'Ports: USB (data and power), HDMI (digital video and audio), VGA (analogue video).'),
      ),
      sec(
        'The fetch–execute cycle',
        fig('fde', 'The address goes from the PC to the MAR, the instruction comes back through the MDR into the CIR, and the PC moves on.'),
        code('MAR ← [PC]\nPC  ← [PC] + 1\nMDR ← [[MAR]]\nCIR ← [MDR]\ndecode and execute'),
        'At the end of each cycle the processor checks for **interrupts**. If one of high enough priority is waiting, the register contents are saved, the PC is loaded with the address of the interrupt service routine, and afterwards the registers are restored.',
      ),
      sec(
        'Assembly language and bits',
        tbl(['Addressing mode', 'The operand is'], ['Immediate (#n)', 'The value itself'], ['Direct', 'The address of the value'], ['Indirect', 'The address of a location that holds the address of the value'], ['Indexed', 'An address to which the contents of IX are added'], ['Relative', 'An offset from the current instruction']),
        ul('A **two-pass assembler**: pass 1 builds the symbol table of labels and addresses; pass 2 generates the machine code using it, so forward references work.', 'Instruction groups: data movement (LDM, LDD, STO), input/output (IN, OUT), arithmetic (ADD, SUB, INC), jumps (JMP, JPE, JPN), compare (CMP).', '**Shifts:** logical (zeros fill), arithmetic (sign bit kept on a right shift), cyclic (bits wrap round). A left shift doubles; a right shift halves.', '**Masks:** AND with 0 clears a bit, OR with 1 sets it, XOR with 1 toggles it; AND with a mask also tests a bit.'),
      ),
    ],
  ),
  topic(
    'cs-system',
    '9618 · 5',
    'System Software',
    'Why a computer needs an operating system · management tasks · utility software · program libraries · translators · IDEs',
    'A compiler translates once. An interpreter translates every run.',
    ['Operating system: Software that manages the hardware and gives programs and users an interface to it.', 'Utility software: Programs that help maintain and manage the computer.', 'Program library: Pre-written, pre-tested code that programs can call.', 'Compiler: Translates the whole of a high-level program into an executable file.', 'Interpreter: Translates and executes a program one statement at a time.'],
    [
      sec(
        'The operating system',
        tbl(['Management task', 'What it does'], ['Memory', 'Allocates RAM to processes, keeps them apart, handles paging and virtual memory'], ['File', 'Naming, folders, access rights, allocating space on storage'], ['Security', 'User accounts, passwords, privileges'], ['Hardware (input/output)', 'Device drivers, buffers, handling interrupts'], ['Process', 'Scheduling which process gets the processor, and for how long']),
        ul('**Utilities:** disk formatter, virus checker, defragmenter, disk contents analysis and repair, file compression, backup.', '**Libraries:** save time because the code is already written and tested. A **dynamic link library** (DLL) is loaded only when needed, so executables are smaller and several programs can share it; but the program fails if the DLL is missing or changed.'),
      ),
      sec(
        'Translators',
        tbl(['', 'Compiler', 'Interpreter'], ['Output', 'An executable file', 'None; source is needed every time'], ['Errors', 'Reported together after translation', 'Stops at the first error, which helps debugging'], ['Speed of final program', 'Fast', 'Slower'], ['Source code', 'Not distributed', 'Must be distributed']),
        'An **assembler** translates assembly language into machine code. Some languages (such as Java) are compiled to intermediate code that an interpreter then runs, so the same code works on any platform.',
        h('IDE features'),
        ul('For writing: context-sensitive prompts, pretty-printing, dynamic syntax checks, expanding and collapsing code blocks.', 'For debugging: single stepping, breakpoints, variable and expression report windows.'),
      ),
    ],
  ),
  topic(
    'cs-security',
    '9618 · 6',
    'Security, Privacy and Integrity',
    'Security, privacy and integrity · threats · protection measures · validation and verification · parity and checksums',
    'Validation checks it is sensible. Verification checks it was copied correctly.',
    ['Data security: Protecting data against loss, damage and unauthorised access.', 'Data privacy: Keeping personal data from people who should not see it.', 'Data integrity: Data being accurate, complete and consistent.', 'Malware: Software written to harm or exploit a computer.', 'Encryption: Scrambling data so it is meaningless without the key.'],
    [
      sec(
        'Threats and protection',
        tbl(['Threat', 'What it is'], ['Virus', 'Malicious code that copies itself and attaches to other files'], ['Spyware', 'Secretly records what the user does and sends it on'], ['Hacking', 'Gaining unauthorised access to a system'], ['Phishing', 'A message pretending to be a trusted sender, to trick the user into giving details'], ['Pharming', 'Redirecting a real website’s visitors to a fake copy']),
        ul('**User accounts and passwords**, with access rights limiting what each user may read or change.', '**Authentication:** passwords, biometrics, digital signatures.', '**Firewall:** checks incoming and outgoing traffic against rules and blocks what breaks them.', '**Anti-virus and anti-spyware** software, kept up to date.', '**Encryption:** does not stop data being intercepted, only being understood.', '**Backups** protect against loss, not against theft.'),
      ),
      sec(
        'Validation and verification',
        tbl(['Validation check', 'Tests that the data'], ['Range', 'Lies between two limits'], ['Format', 'Matches a pattern, such as LLNNN'], ['Length', 'Has the right number of characters'], ['Presence', 'Has been entered at all'], ['Existence', 'Matches something already stored, such as a real product code'], ['Limit', 'Is above (or below) one boundary'], ['Check digit', 'Has a final digit that agrees with a calculation on the others']),
        ul('**Verification on entry:** visual check, or double entry (typed twice and compared).', '**Verification on transfer:** parity check (even or odd parity bit per byte; parity block for locating an error), checksum (a value calculated from the data and sent with it, recalculated on arrival).'),
        trap('Validation cannot tell whether data is **correct**, only whether it is reasonable. A wrong but plausible date of birth passes.'),
      ),
    ],
  ),
  topic(
    'cs-ethics',
    '9618 · 7',
    'Ethics and Ownership',
    'Professional ethics · copyright · software licences · the impact of artificial intelligence',
    'Free software is about freedom, not price.',
    ['Ethics: Moral principles that guide what is right behaviour.', 'Copyright: The legal right of a creator to control how their work is copied and used.', 'Software licence: The terms under which software may be used, copied or changed.', 'Artificial intelligence: Systems that perform tasks normally needing human intelligence.'],
    [
      sec(
        'Professional ethics',
        'Professional bodies such as the **BCS** (British Computer Society) and the **IEEE** publish codes of conduct. Members agree to act in the public interest, work only within their competence, be honest, keep information confidential and keep their skills up to date. Joining shows employers and clients that a professional meets a standard.',
        tip('In scenario questions, name the stakeholder harmed and the principle broken, then say what the person should do instead.'),
      ),
      sec(
        'Ownership and licences',
        tbl(['Licence', 'Source code', 'What the user may do'], ['Free Software Foundation', 'Available', 'Run, study, change and share it, as long as copies stay under the same terms'], ['Open Source Initiative', 'Available', 'Use, modify and redistribute it; collaborative development'], ['Shareware', 'Not available', 'Try it free for a limited time or with limited features, then pay'], ['Commercial', 'Not available', 'Use it after paying, within the licence; no copying or changing']),
        'Copyright law gives formal ownership and makes copying without permission illegal, which protects the income of the author.',
      ),
      sec(
        'Artificial intelligence',
        ul('**Social:** easier access to services and information; concerns over privacy and bias in decisions.', '**Economic:** higher productivity and new kinds of work; some jobs replaced.', '**Environmental:** better modelling and efficiency; large energy use by data centres.'),
        'Typical applications: voice assistants, recommendation systems, self-driving vehicles, medical diagnosis.',
      ),
    ],
  ),
  topic(
    'cs-databases',
    '9618 · 8',
    'Databases',
    'File-based limits · relational database terms · E-R diagrams · normalisation · the DBMS · SQL',
    'Every non-key attribute depends on the key, the whole key, and nothing but the key.',
    ['Entity: Something about which data is stored.', 'Primary key: An attribute (or set) that uniquely identifies each record.', 'Foreign key: An attribute in one table that refers to the primary key of another.', 'Candidate key: Any attribute that could serve as the primary key.', 'Referential integrity: Every foreign key value matches an existing primary key value.', 'Data dictionary: Data about the data: table names, fields, types, keys, validation.'],
    [
      sec(
        'Why relational',
        'A file-based approach repeats data in many files (**redundancy**), so copies drift apart (**inconsistency**), and programs depend on the file layout. A relational database stores each fact once in linked tables.',
        ul('Table = entity = relation; row = record = tuple; column = field = attribute.', 'Relationships: one-to-one, one-to-many, many-to-many. A many-to-many link is resolved with a **link table** holding both foreign keys.', 'A **secondary key** and **indexing** make searching faster on a non-key field.'),
      ),
      sec(
        'Normalisation',
        tbl(['Form', 'Rule'], ['1NF', 'No repeating groups; every field holds a single value'], ['2NF', '1NF, and no partial dependency: no field depends on only part of a composite key'], ['3NF', '2NF, and no transitive dependency: no non-key field depends on another non-key field']),
        'The **DBMS** provides the data dictionary, data modelling, a logical schema, integrity and security (access rights, backup), plus tools: a developer interface and a **query processor**.',
      ),
      sec(
        'SQL',
        code('CREATE TABLE Student (\n  StudentID INTEGER NOT NULL,\n  Name VARCHAR(40),\n  ClassID CHAR(3),\n  PRIMARY KEY (StudentID),\n  FOREIGN KEY (ClassID) REFERENCES Class(ClassID)\n);\n\nSELECT Name, Mark\nFROM Student INNER JOIN Result\n  ON Student.StudentID = Result.StudentID\nWHERE Mark >= 50\nORDER BY Mark DESC;\n\nSELECT ClassID, COUNT(*), AVG(Mark)\nFROM Result GROUP BY ClassID;\n\nINSERT INTO Student VALUES (17, \'Mei\', \'12A\');\nUPDATE Student SET ClassID = \'12B\' WHERE StudentID = 17;\nDELETE FROM Student WHERE StudentID = 17;'),
        '**DDL** defines the structure (CREATE DATABASE, CREATE TABLE, ALTER TABLE). **DML** works on the data (SELECT, INSERT INTO, UPDATE, DELETE FROM).',
      ),
    ],
  ),
];

const practical = [
  topic(
    'cs-algorithms',
    '9618 · 9',
    'Algorithm Design',
    'Computational thinking · abstraction and decomposition · structured English, flowcharts and pseudocode · stepwise refinement',
    'Break it down until every step is obvious.',
    ['Abstraction: Keeping only the details needed to solve the problem and leaving out the rest.', 'Decomposition: Breaking a problem into smaller sub-problems.', 'Algorithm: A sequence of defined steps that solves a problem.', 'Stepwise refinement: Expanding each step into more detail until it can be coded.', 'Identifier table: A list of each identifier with its data type and purpose.'],
    [
      sec(
        'Computational thinking',
        ul('**Abstraction** gives a simpler model that is quicker to design and program: a rail map shows stations and lines, not distances.', '**Decomposition** leads to modules that can be written, tested and reused separately, by different people.', 'Every algorithm is built from three constructs: **sequence**, **selection** and **iteration**.'),
      ),
      sec(
        'Writing algorithms',
        tbl(['Form', 'Use'], ['Structured English', 'Numbered plain-language steps'], ['Flowchart', 'Shapes: rounded box start/stop, parallelogram input/output, rectangle process, diamond decision'], ['Pseudocode', 'Cambridge keywords in capitals, indented blocks']),
        code('DECLARE Total : INTEGER\nDECLARE Count : INTEGER\nTotal ← 0\nFOR Count ← 1 TO 10\n  INPUT Number\n  IF Number > 0 THEN\n    Total ← Total + Number\n  ENDIF\nNEXT Count\nOUTPUT "Total of positives: ", Total'),
        tip('Use meaningful identifiers and the ← arrow for assignment. A logic statement such as "Total > 100 AND NOT Finished" should be written exactly, not described.'),
      ),
    ],
  ),
  topic(
    'cs-structures',
    '9618 · 10',
    'Data Types and Structures',
    'Primitive types · records · 1D and 2D arrays · linear search and bubble sort · text files · stacks, queues and linked lists',
    'A stack is last in, first out. A queue is first in, first out.',
    ['Record: A composite type that groups fields of different data types under one name.', 'Array: A fixed-size, indexed collection of items of the same data type.', 'Abstract data type: A collection of data together with the operations allowed on it.', 'Stack: A LIFO structure with push and pop at the top.', 'Queue: A FIFO structure; items join at the rear and leave from the front.', 'Linked list: Nodes that each hold data and a pointer to the next node.'],
    [
      sec(
        'Types, records and arrays',
        'Primitive types: INTEGER, REAL, CHAR, STRING, BOOLEAN, DATE.',
        code('TYPE TStudent\n  DECLARE Name : STRING\n  DECLARE Mark : INTEGER\nENDTYPE\n\nDECLARE Class : ARRAY[1:30] OF TStudent\nDECLARE Grid : ARRAY[1:8, 1:8] OF CHAR\nClass[1].Name ← "Mei"'),
        h('Bubble sort'),
        code('REPEAT\n  Swapped ← FALSE\n  FOR i ← 1 TO Last - 1\n    IF List[i] > List[i + 1] THEN\n      Temp ← List[i]\n      List[i] ← List[i + 1]\n      List[i + 1] ← Temp\n      Swapped ← TRUE\n    ENDIF\n  NEXT i\n  Last ← Last - 1\nUNTIL NOT Swapped'),
        'A **linear search** checks each element in turn until the item is found or the end is reached; it works on unsorted data.',
      ),
      sec(
        'Files',
        code('OPENFILE "marks.txt" FOR READ\nWHILE NOT EOF("marks.txt")\n  READFILE "marks.txt", Line\n  OUTPUT Line\nENDWHILE\nCLOSEFILE "marks.txt"'),
        'Modes: READ, WRITE (starts a new file, replacing any old one) and APPEND (adds to the end). Files keep data after the program ends.',
      ),
      sec(
        'Abstract data types',
        tbl(['ADT', 'Pointers needed', 'Typical use'], ['Stack', 'Top of stack', 'Undo, procedure calls, reversing'], ['Queue', 'Front and rear (circular in an array)', 'Print jobs, keyboard buffer'], ['Linked list', 'Start pointer, a next pointer in each node, a free list', 'Data that grows, shrinks or is kept in order']),
        ul('All three can be built from arrays plus integer pointers.', 'Check for **full** before adding and **empty** before removing.', 'In a linked list, inserting or deleting only changes pointers; no items are moved.'),
      ),
    ],
  ),
  topic(
    'cs-programming',
    '9618 · 11',
    'Programming',
    'Variables and constants · selection · iteration · procedures and functions · parameters · string handling',
    'A function returns a value. A procedure does not.',
    ['Constant: A named value that cannot change while the program runs.', 'Parameter: A value passed into a procedure or function.', 'By value: A copy is passed; the original cannot be changed.', 'By reference: The address is passed; changes affect the original.', 'Local variable: One that exists only inside the module that declares it.'],
    [
      sec(
        'Selection and iteration',
        code('IF Mark >= 50 THEN\n  OUTPUT "Pass"\nELSE\n  OUTPUT "Fail"\nENDIF\n\nCASE OF Grade\n  "A" : Points ← 5\n  "B" : Points ← 4\n  OTHERWISE : Points ← 0\nENDCASE'),
        tbl(['Loop', 'Type', 'Use when'], ['FOR … NEXT', 'Count-controlled', 'The number of repeats is known'], ['WHILE … ENDWHILE', 'Pre-condition', 'It may need to run zero times'], ['REPEAT … UNTIL', 'Post-condition', 'It must run at least once']),
      ),
      sec(
        'Procedures and functions',
        code('PROCEDURE Swap(BYREF A : INTEGER, BYREF B : INTEGER)\n  DECLARE Temp : INTEGER\n  Temp ← A\n  A ← B\n  B ← Temp\nENDPROCEDURE\n\nFUNCTION Area(BYVAL W : REAL, BYVAL H : REAL) RETURNS REAL\n  RETURN W * H\nENDFUNCTION\n\nCALL Swap(X, Y)\nSize ← Area(3.0, 4.5)'),
        ul('A procedure is called with CALL; a function is used inside an expression.', 'Modules make code reusable, easier to test, and easier to read and maintain.', 'Prefer local variables and parameters to globals.'),
        h('String functions'),
        code('LENGTH("Hello")       → 5\nLEFT("Hello", 2)      → "He"\nRIGHT("Hello", 3)     → "llo"\nMID("Hello", 2, 3)    → "ell"\nUCASE("Hello")        → "HELLO"\n"Hel" & "lo"          → "Hello"'),
      ),
    ],
  ),
  topic(
    'cs-development',
    '9618 · 12',
    'Software Development',
    'The program development life cycle · waterfall, iterative and RAD · structure charts and state-transition diagrams · testing · maintenance',
    'Test with normal, abnormal, extreme and boundary data.',
    ['Syntax error: Code that breaks the rules of the language; found on translation.', 'Logic error: The program runs but gives the wrong result.', 'Run-time error: The program fails while running, such as division by zero.', 'Stub: A simple stand-in for a module that is not yet written.', 'Dry run: Working through code by hand with a trace table.'],
    [
      sec(
        'Life cycle and models',
        'Stages: **analysis, design, coding, testing, maintenance**.',
        tbl(['Model', 'How', 'Good and bad'], ['Waterfall', 'Each stage finished before the next', 'Easy to manage and document; hard to change, working software arrives late'], ['Iterative', 'Repeated cycles, each improving the product', 'Feedback early, bugs found sooner; needs customer involvement'], ['Rapid application development', 'Prototypes built in parallel with little planning', 'Fast, flexible; suits small to medium projects, needs skilled teams']),
        ul('A **structure chart** shows how a program is decomposed into modules and the parameters passed between them (plus selection and iteration symbols).', 'A **state-transition diagram** shows the states a system can be in and the events that move it between them.'),
      ),
      sec(
        'Testing and maintenance',
        tbl(['Method', 'What it is'], ['Dry run / walkthrough', 'Tracing the code by hand, alone or with a team'], ['White-box', 'Tests chosen from the code, so every path is run'], ['Black-box', 'Tests chosen from the specification, without seeing the code'], ['Integration', 'Modules tested together as they are combined'], ['Alpha', 'In-house testing by the developers'], ['Beta', 'Released to selected outside users'], ['Acceptance', 'The customer checks it meets the requirements'], ['Stub', 'Dummy modules stand in so the rest can be tested']),
        ul('Test data: **normal** (accepted), **abnormal** (rejected), **extreme** (largest and smallest accepted values), **boundary** (just either side of a limit).', 'Maintenance: **corrective** (fix errors), **adaptive** (new requirements or environment), **perfective** (improve performance or usability).'),
        tip('A test plan row needs the purpose, the test data, and the expected result.'),
      ),
    ],
  ),
];

export const CS: NoteSubject = {
  id: 'cs',
  name: 'Computer Science',
  study: 'Computer Science',
  board: 'Cambridge International 9618',
  hue: 140,
  units: [
    { id: 'p1', code: 'Paper 1', name: 'Theory Fundamentals', topics: theory },
    { id: 'p2', code: 'Paper 2', name: 'Problem-solving and Programming', topics: practical },
  ],
};
