import fs from "fs";
import path from "path";

const run = async () => {
  try {
    // 1. Find all running processes
    console.log("Reading /proc directory...");
    const files = fs.readdirSync("/proc");
    const pids = files.filter(f => /^\d+$/.test(f));
    console.log(`Found ${pids.length} process directories in /proc`);

    for (const pid of pids) {
      try {
        const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, "utf8").replace(/\0/g, " ");
        if (cmdline.includes("node") || cmdline.includes("tsx") || cmdline.includes("server.ts")) {
          console.log(`\nFound matching process - PID: ${pid}, Cmdline: ${cmdline}`);
          
          // Let's list file descriptors of this process
          const fdPath = `/proc/${pid}/fd`;
          if (fs.existsSync(fdPath)) {
            const fds = fs.readdirSync(fdPath);
            console.log(`Fds for PID ${pid}:`, fds);
            
            // Let's see if we can read the symlink targets of fd 1 and 2
            for (const fd of fds) {
              try {
                const target = fs.readlinkSync(`${fdPath}/${fd}`);
                console.log(`  fd ${fd} -> ${target}`);
                
                // If it is a log file or a pipe, can we read it?
                // If it's a pipe, we can't easily read it, but if it is a log file we can.
              } catch (e) {
                // ignore
              }
            }
          }
        }
      } catch (err) {
        // process might have exited or permission denied
      }
    }
  } catch (err: any) {
    console.error("Error in read_proc_fd:", err);
  }
};

run();
