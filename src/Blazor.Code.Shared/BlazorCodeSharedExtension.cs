using Blazor.Code.Shared;
using Masa.Blazor.Extensions.Languages.Razor;
using Microsoft.AspNetCore.Razor.Language;
using Microsoft.CodeAnalysis;
using System.Runtime.Loader;

namespace Microsoft.Extensions.DependencyInjection;

public static class BlazorCodeSharedExtension
{
    public static IServiceProvider ServiceProvider { get; private set; }

    public static CodeEnvironment CodeEnvironment
    {
        get;
        private set;
    }

    public static List<PortableExecutableReference> PortableExecutableReferences = new();

    private static List<string> Assemblys = new()
    {
        "BlazorComponent",
        "Masa.Blazor",
        "OneOf",
        "FluentValidation",
        "FluentValidation.DependencyInjectionExtensions",
        "System",
        "Microsoft.AspNetCore.Components",
        "System.Linq.Expressions",
        "System.Net.Http.Json",
        "System.Private.CoreLib",
        "Microsoft.AspNetCore.Components.Web",
        "System.Collections",
        "System.Linq",
        "System.Runtime"
    };

    public static async void AddBlazorCodeShared(this IServiceCollection services, CodeEnvironment environment = CodeEnvironment.WebAssembly)
    {
        CodeEnvironment = environment;
        // 默认添加 全局引用
        CompileRazorProjectFileSystem.AddGlobalUsing("@using Masa.Blazor");
        CompileRazorProjectFileSystem.AddGlobalUsing("@using BlazorComponent");
        CompileRazorProjectFileSystem.AddGlobalUsing("@using Masa.Blazor.Presets");

        services.AddMasaBlazor();

        services.AddSingleton(typeof(KeyEventBus<>));

        await Task.Run(async () =>
        {
            await GetReferenceAsync(services);
            RazorCompile.Initialized(PortableExecutableReferences, GetRazorExtension());
        });
    }

    static async Task GetReferenceAsync(IServiceCollection services)
    {
        HttpClient? httpClient = null;

        if (CodeEnvironment == CodeEnvironment.WebAssembly)
        {
            foreach (var assembly in Assemblys)
            {
                try
                {
                    if (httpClient == null)
                    {
                        httpClient = services.BuildServiceProvider().GetService<HttpClient>();
                    }
                    using var stream = await httpClient!.GetStreamAsync($"_framework/{assembly}.dll");
                    if (stream?.Length > 0)
                    {
                        PortableExecutableReferences?.Add(MetadataReference.CreateFromStream(stream));
                    }
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                }
            }
        }
        else
        {
            foreach (var assembly in AssemblyLoadContext.Default.Assemblies)
            {
                PortableExecutableReferences?.Add(MetadataReference.CreateFromFile(assembly.Location));
            }
        }

    }

    static List<RazorExtension> GetRazorExtension()
    {
        var exits = new List<RazorExtension>();

        foreach (var asm in typeof(BlazorCodeSharedExtension).Assembly.GetReferencedAssemblies())
        {
            exits.Add(new AssemblyExtension(asm.FullName, AppDomain.CurrentDomain.Load(asm.FullName)));
        }

        return exits;
    }

    /// <summary>
    /// 添加服务提供
    /// </summary>
    /// <param name="serviceProvider"></param>
    public static void UseServiceProvider(this IServiceProvider serviceProvider)
        => ServiceProvider = serviceProvider;
}