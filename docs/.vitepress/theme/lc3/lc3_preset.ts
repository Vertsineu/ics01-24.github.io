interface LabPreset {
  /** Function body to tidy up lc3Core for test and return the expected result */
  testCode: string
  /** Function body to get the actual result after run a testcase */
  ansCode: string
  /** Testcases seperated by comma */
  testCases: string
}

const labs: Record<string, LabPreset> = {
  lab1: {
    testCode: `
let [number, id] = testcase.split(':').map(Number)
lc3.r[0] = number
const secret = parseInt(id.toString().split("").map(c => {
    if ("13579".includes(c)) return "1"     
    else return "0" 
}).join(""),2);
return (number ^ secret) & 0xffff`,
    ansCode: 'return lc3.r[3]',
    testCases: '194:12345678, 100:12345678',
  },
  lab2: {
    testCode: `
let [n] = testcase.split(':').map(Number)
lc3.memory[0x3100] = n
var k = 0
var i = n
while (i != 1 || k == 0) {
    k++
    if ((i % 2)==0) {
        i = i / 2
    }
    else{
        i = 3 * i + 1
    }
}
return k`,
    ansCode: 'return lc3.memory[0x3101]',
    testCases: '6, 16, 26, 36, 46',
  },
  lab3: {
    testCode: `
let [str,n] = testcase.split(':')
lc3.memory[0x3100] = parseInt(n)
for (let i = 0; i < str.length; i++) {
  lc3.memory[0x3101 + i] = str.charCodeAt(i);
}
var i = 0
var j = n - 1
while(i <= j){
  if(str[i] == str[j]){
    i++
    j--
  }
  else return 0
} 
return 1`,
    ansCode: `
return lc3.memory[0x3200]`,
    testCases: ':0, abcba:5, aBaDCDEDCDaBa:13, aBaDCDEfDCDaBa:14',
  },
  lab3_p: {
    testCode: `
let [str,n] = testcase.split(':')
lc3.memory[0x3100] = parseInt(n)
for (let i = 0; i < str.length; i++) {
  lc3.memory[0x3101 + i] = str.charCodeAt(i);
}
var i = 0
var j = n - 1
while(i <= j){
  if (str[i].toLowerCase() === str[j].toLowerCase()) {
    i++
    j--
  }
  else return 0
} 
return 1`,
    ansCode: `
return lc3.memory[0x3200]`,
    testCases: ':0, abcba:5, ABaDcdEDCDaBa:13, aBaDCDEfDCDaBa:14',
  },
  lab4: {
    testCode: `
let n = Number(testcase)
lc3.memory[0x3100] = n
let earnArray = new Array(100).fill(-1);    // 假设最大n为100，数组初始化为-1
let spendArray = new Array(100).fill(-1);
let savingsArray = new Array(100).fill(-1);

// earn 函数
function earn(n) {
  if (earnArray[n] !== -1) {
    return earnArray[n];
  }
  if (n === 0) {
    earnArray[n] = 6;
  } else {
    earnArray[n] = earn(n - 1) * 2;
  }
  return earnArray[n];
}

// spend 函数
function spend(n) {
  if (spendArray[n] !== -1) {
    return spendArray[n];
  }
  if (n === 0) {
    spendArray[n] = 2;
  } else if (spend(n - 1) >= earn(n - 1)) {
    spendArray[n] = 2;
  } else {
    spendArray[n] = spend(n - 1) * 4;
  }
  return spendArray[n];
}

// savings 函数
function savings(n) {
  if (savingsArray[n] !== -1) {
    return savingsArray[n];
  }
  if (n === 0) {
    savingsArray[n] = 10;
  } else {
    savingsArray[n] = savings(n - 1) + earn(n - 1) - spend(n - 1);
  }
  return savingsArray[n];
}
return savings(n)
`,
    ansCode: `
return lc3.memory[0x3200]
`,
    testCases: '5,6,7,8,9,10',
  },
  lab5: {
    testCode: `    
    const RANDOM = false;

    // randomize lc3.r
    if (RANDOM) {
        for (let i = 0; i < 8; i++) {
            lc3.r[i] = Math.floor(Math.random() * 65536);
        }
    }
    
    // testcase is an string of "0" and "1"
    // find how many "1010" in testcase using state machine
    let count = 0;
    let state = 0;
    for (let i = 0; i < testcase.length; i++) {
        if (state === 0) {
            if (testcase[i] === "1") {
                state = 1;
            }
        } else if (state === 1) {
            if (testcase[i] === "0") {
                state = 2;
            }
        } else if (state === 2) {
            if (testcase[i] === "1") {
                state = 3;
            } else {
                state = 0;
            }
        } else if (state === 3) {
            if (testcase[i] === "0") {
                state = 2;
                count++;
            } else {
                state = 1;
            }
        }
    }

    const KBSR_ADDR = 0xFE00;
    const KBDR_ADDR = 0xFE02;
    const DSR_ADDR = 0xFE04;
    const DDR_ADDR = 0xFE06;

    // init KBSR_ADDR and DSR_ADDR
    lc3.memory[KBSR_ADDR] = 0x8000;
    lc3.memory[DSR_ADDR] = 0x8000;

    // init lc3.result (a string to receive the output)
    lc3.result = "";

    // convert testcase into a generator with each char
    function* input() {
        for (let i = 0; i < testcase.length; i++) {
            yield testcase[i];
        }
    }
    const gen = input();

    // add listener to memory[xFE02]
    // if read memory[xFE02], set memory[xFE02] to the next char of testcase
    // add listener to memory[xFE06]
    // if write memory[xFE06], append the char to lc3.result
    lc3.memory = new Proxy(lc3.memory, {
        get: function(target, prop, receiver) {
            if (prop === KBDR_ADDR.toString()) {
                const next = gen.next();
                if (next.done) {
                    // if done, set KBSR_ADDR to 0
                    lc3.memory[KBSR_ADDR] = 0;
                    return 0;
                } else {
                    lc3.memory[KBSR_ADDR] = 0x8000;
                    return next.value.charCodeAt(0);
                }
            }
            return Reflect.get(...arguments);
        },
        set: function(target, prop, value, receiver) {
            if (prop === DDR_ADDR.toString()) {
                lc3.result += String.fromCharCode(value);
                lc3.memory[DSR_ADDR] = 0x8000;
            }
            return Reflect.set(...arguments);
        }
    });

    return String(count);
    `,
    ansCode: `return lc3.result;`,
    testCases: "1010y, 101010y, 1000001010y, 101111010y, 10101010001011101010y",
  },
  自定义: {
    testCode: '',
    ansCode: '',
    testCases: '',
  },
}

export const presets = Object.keys(labs)

export function getPreset(lab: string) {
  return labs[lab]
}
