// Set this to a local reference dist directory before running sync:arena.
// The selected machine path is never written into published metadata.
import {resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
const directory=process.env.POKEWALLCLASH_REFERENCE_DIR;
if(!directory)throw new Error('Set POKEWALLCLASH_REFERENCE_DIR to the local reference dist directory before importing.');
export const referenceSource=pathToFileURL(resolve(directory)+sep);
