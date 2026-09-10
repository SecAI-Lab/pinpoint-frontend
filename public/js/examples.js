// The four cases of Figure 6 of the PinPoint paper, as deep links into this site.
//
// Nothing here is written from scratch: `title` is the paper's own heading for the
// case in Section V-E, and `caption` is its Figure 6 sub-caption, both verbatim.
// The db/file/idx/target quadruple addresses the view, and matches the
// figure-generation scripts in Paper/figure/code (case1_djpeg_readmarkers.py,
// case2_nmnew_dwarf2findline.py, case3_shred_dowipefd.py,
// case4_readelf_applyrelocations.py).
export const PAPER_CASES = [
  {
    figure: '6a',
    title: 'Token-Stride Localization of a Fragmented Inlinee',
    caption: 'Locating get_sos (CVE-2012-2806) within read_markers from djpeg ' +
             'under Clang -O1 (Type II).',
    refFunc: 'get_sos',
    target: 'read_markers',
    db: 'regular',
    file: 'libjpeg-djpeg-06-clang-O1',
    idx: 1,
  },
  {
    figure: '6b',
    title: 'Basic-block-stride Localization of a Fragmented Inlinee',
    caption: 'Locating parse_comp_unit (CVE-2017-15022) within ' +
             '_bfd_dwarf2_find_nearest_line from nmnew under Clang -O2 (Type II).',
    refFunc: 'parse_comp_unit',
    target: '_bfd_dwarf2_find_nearest_line',
    db: 'regular',
    file: 'binutils-nmnew-22-clang-O2',
    idx: 67,
  },
  {
    figure: '6c',
    title: 'Token-Stride Localization under Nested Inlining',
    caption: 'Locating fillpattern (gnubug-26545) within do_wipefd from shred ' +
             'under Clang -O3 (Type II).',
    refFunc: 'fillpattern',
    target: 'do_wipefd',
    db: 'fno_inline',
    file: 'coreutils-shred-45-clang-O3',
    idx: 6,
  },
  {
    figure: '6d',
    title: 'Basic-block-stride Localization in a Vulnerable Inliner',
    caption: 'Locating target_specific_reloc_handling (CVE-2017-6965) within ' +
             'apply_relocations from readelf under GCC -O2 (Type IV).',
    refFunc: 'apply_relocations',
    target: 'apply_relocations',
    db: 'regular',
    file: 'binutils-readelf-65-gcc-O2',
    idx: 4,
  },
];
